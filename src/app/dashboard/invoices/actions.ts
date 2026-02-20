"use server"

// Server actions pour la gestion des factures
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import type { Unit } from "@/generated/prisma/client"
import { canCreateInvoice } from "@/lib/plan-limits"
import { calculateItemTotals, calculateDocumentTotals } from "@/lib/calculations"

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description requise"),
  quantity: z.number().positive("Quantité positive requise"),
  unit: z.string(),
  unitPriceHt: z.number().min(0, "Prix positif requis"),
  vatRate: z.number().min(0).max(100),
  discountPercent: z.number().min(0).max(100).default(0),
})

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Veuillez sélectionner un client"),
  subject: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  dueDate: z.string().min(1, "Date d'échéance requise"),
  discountPercent: z.number().min(0).max(100).default(0),
  items: z.array(invoiceItemSchema).min(1, "Au moins une ligne est requise"),
})

export type InvoiceFormData = z.infer<typeof invoiceSchema>

// Récupérer la company et le user connecté
async function getUserCompany() {
  const user = await requireUser()
  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) throw new Error("Profil entreprise non configuré")
  return { company, user }
}

// Générer le numéro de facture suivant (ex: FA-2026-0001)
function generateInvoiceNumber(prefix: string, nextNum: number): string {
  const year = new Date().getFullYear()
  const num = String(nextNum).padStart(4, "0")
  return `${prefix}-${year}-${num}`
}

// Créer une facture manuellement (sans devis source)
export async function createInvoice(data: InvoiceFormData) {
  const { company, user } = await getUserCompany()

  const check = await canCreateInvoice(user.id, user.plan)
  if (!check.allowed) throw new Error(check.message)

  const validated = invoiceSchema.parse(data)

  // Calculer les totaux avec remise globale
  const docTotals = calculateDocumentTotals(validated.items, validated.discountPercent)

  const number = generateInvoiceNumber(company.invoicePrefix, company.nextInvoiceNum)

  const invoice = await prisma.$transaction(async (tx) => {
    await tx.company.update({
      where: { id: company.id },
      data: { nextInvoiceNum: { increment: 1 } },
    })

    return await tx.invoice.create({
      data: {
        companyId: company.id,
        clientId: validated.clientId,
        number,
        subject: validated.subject || null,
        notes: validated.notes || null,
        dueDate: new Date(validated.dueDate),
        discountPercent: validated.discountPercent,
        totalHt: docTotals.totalHt,
        totalVat: docTotals.totalVat,
        totalTtc: docTotals.totalTtc,
        items: {
          create: validated.items.map((item, index) => {
            const itemTotals = calculateItemTotals(
              item.quantity, item.unitPriceHt, item.vatRate, item.discountPercent
            )
            return {
              description: item.description,
              quantity: item.quantity,
              unit: item.unit as Unit,
              unitPriceHt: item.unitPriceHt,
              vatRate: item.vatRate,
              discountPercent: item.discountPercent,
              totalHt: itemTotals.totalHt,
              position: index,
            }
          }),
        },
      },
    })
  })

  revalidatePath("/dashboard/invoices")
  redirect(`/dashboard/invoices/${invoice.id}`)
}

// Mettre à jour une facture brouillon
export async function updateInvoice(invoiceId: string, data: InvoiceFormData) {
  const { company } = await getUserCompany()
  const validated = invoiceSchema.parse(data)

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, companyId: company.id },
  })
  if (!invoice) throw new Error("Facture introuvable")
  if (invoice.status !== "DRAFT") throw new Error("Seuls les brouillons peuvent être modifiés")

  // Calculer les totaux avec remise globale
  const docTotals = calculateDocumentTotals(validated.items, validated.discountPercent)

  await prisma.$transaction(async (tx) => {
    // Supprimer les anciennes lignes
    await tx.invoiceItem.deleteMany({ where: { invoiceId } })

    // Mettre à jour la facture + recréer les lignes
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        clientId: validated.clientId,
        subject: validated.subject || null,
        notes: validated.notes || null,
        dueDate: new Date(validated.dueDate),
        discountPercent: validated.discountPercent,
        totalHt: docTotals.totalHt,
        totalVat: docTotals.totalVat,
        totalTtc: docTotals.totalTtc,
        items: {
          create: validated.items.map((item, index) => {
            const itemTotals = calculateItemTotals(
              item.quantity, item.unitPriceHt, item.vatRate, item.discountPercent
            )
            return {
              description: item.description,
              quantity: item.quantity,
              unit: item.unit as Unit,
              unitPriceHt: item.unitPriceHt,
              vatRate: item.vatRate,
              discountPercent: item.discountPercent,
              totalHt: itemTotals.totalHt,
              position: index,
            }
          }),
        },
      },
    })
  })

  revalidatePath("/dashboard/invoices")
  redirect(`/dashboard/invoices/${invoiceId}`)
}

// Créer une facture depuis un devis existant (conversion 1 clic)
export async function createInvoiceFromQuote(quoteId: string) {
  const { company, user } = await getUserCompany()

  // Vérifier les limites du plan
  const check = await canCreateInvoice(user.id, user.plan)
  if (!check.allowed) throw new Error(check.message)

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, companyId: company.id },
    include: { items: { orderBy: { position: "asc" } } },
  })
  if (!quote) throw new Error("Devis introuvable")

  // Vérifier que le devis est accepté
  if (quote.status !== "ACCEPTED") {
    throw new Error("Seuls les devis acceptés peuvent être convertis en facture")
  }

  const number = generateInvoiceNumber(company.invoicePrefix, company.nextInvoiceNum)

  // Date d'échéance par défaut : 30 jours
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30)

  const invoice = await prisma.$transaction(async (tx) => {
    // Incrémenter le compteur
    await tx.company.update({
      where: { id: company.id },
      data: { nextInvoiceNum: { increment: 1 } },
    })

    // Créer la facture avec les lignes copiées du devis
    return await tx.invoice.create({
      data: {
        companyId: company.id,
        clientId: quote.clientId,
        quoteId: quote.id,
        number,
        subject: quote.subject,
        notes: quote.notes,
        dueDate,
        discountPercent: quote.discountPercent,
        totalHt: quote.totalHt,
        totalVat: quote.totalVat,
        totalTtc: quote.totalTtc,
        items: {
          create: quote.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit as Unit,
            unitPriceHt: item.unitPriceHt,
            vatRate: item.vatRate,
            discountPercent: item.discountPercent,
            totalHt: item.totalHt,
            position: item.position,
          })),
        },
      },
    })
  })

  revalidatePath("/dashboard/invoices")
  revalidatePath("/dashboard/quotes")
  redirect(`/dashboard/invoices/${invoice.id}`)
}

// Mettre à jour le statut d'une facture
export async function updateInvoiceStatus(
  invoiceId: string,
  status: "SENT" | "PAID" | "CANCELLED",
  paymentMethod?: string
) {
  const { company } = await getUserCompany()

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, companyId: company.id },
  })
  if (!invoice) throw new Error("Facture introuvable")

  const updateData: Record<string, unknown> = { status }

  if (status === "SENT") {
    updateData.sentAt = new Date()
  }

  if (status === "PAID") {
    updateData.paidAt = new Date()
    updateData.paidAmount = invoice.totalTtc
    if (paymentMethod) updateData.paymentMethod = paymentMethod
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: updateData,
  })

  revalidatePath("/dashboard/invoices")
  revalidatePath(`/dashboard/invoices/${invoiceId}`)
}

// Supprimer une facture (seulement les brouillons)
export async function deleteInvoice(invoiceId: string) {
  const { company } = await getUserCompany()

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, companyId: company.id },
  })
  if (!invoice) throw new Error("Facture introuvable")

  if (invoice.status !== "DRAFT") {
    throw new Error("Seuls les brouillons peuvent être supprimés")
  }

  await prisma.invoice.delete({
    where: { id: invoiceId },
  })

  revalidatePath("/dashboard/invoices")
  redirect("/dashboard/invoices")
}

// Archiver une facture (non-DRAFT uniquement)
export async function archiveInvoice(invoiceId: string) {
  const { company } = await getUserCompany()

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, companyId: company.id },
  })
  if (!invoice) throw new Error("Facture introuvable")
  if (invoice.status === "DRAFT") throw new Error("Les brouillons doivent être supprimés, pas archivés")

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { archivedAt: new Date() },
  })

  revalidatePath("/dashboard/invoices")
}

// Restaurer une facture archivée
export async function restoreInvoice(invoiceId: string) {
  const { company } = await getUserCompany()

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, companyId: company.id },
  })
  if (!invoice) throw new Error("Facture introuvable")

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { archivedAt: null },
  })

  revalidatePath("/dashboard/invoices")
}

// Archiver plusieurs factures (non-DRAFT uniquement)
export async function bulkArchiveInvoices(invoiceIds: string[]) {
  const { company } = await getUserCompany()

  await prisma.invoice.updateMany({
    where: {
      id: { in: invoiceIds },
      companyId: company.id,
      status: { not: "DRAFT" },
    },
    data: { archivedAt: new Date() },
  })

  revalidatePath("/dashboard/invoices")
}

// Supprimer plusieurs factures brouillon
export async function bulkDeleteInvoices(invoiceIds: string[]) {
  const { company } = await getUserCompany()

  await prisma.invoice.deleteMany({
    where: {
      id: { in: invoiceIds },
      companyId: company.id,
      status: "DRAFT",
    },
  })

  revalidatePath("/dashboard/invoices")
}

// Dupliquer une facture existante (crée un nouveau brouillon)
export async function duplicateInvoice(invoiceId: string) {
  const { company, user } = await getUserCompany()

  const check = await canCreateInvoice(user.id, user.plan)
  if (!check.allowed) throw new Error(check.message)

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, companyId: company.id },
    include: { items: { orderBy: { position: "asc" } } },
  })
  if (!invoice) throw new Error("Facture introuvable")

  const number = generateInvoiceNumber(company.invoicePrefix, company.nextInvoiceNum)

  // Échéance 30 jours
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30)

  const newInvoice = await prisma.$transaction(async (tx) => {
    await tx.company.update({
      where: { id: company.id },
      data: { nextInvoiceNum: { increment: 1 } },
    })

    return await tx.invoice.create({
      data: {
        companyId: company.id,
        clientId: invoice.clientId,
        number,
        subject: invoice.subject ? `${invoice.subject} (copie)` : null,
        notes: invoice.notes,
        dueDate,
        discountPercent: invoice.discountPercent,
        totalHt: invoice.totalHt,
        totalVat: invoice.totalVat,
        totalTtc: invoice.totalTtc,
        items: {
          create: invoice.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit as Unit,
            unitPriceHt: item.unitPriceHt,
            vatRate: item.vatRate,
            discountPercent: item.discountPercent,
            totalHt: item.totalHt,
            position: item.position,
          })),
        },
      },
    })
  })

  revalidatePath("/dashboard/invoices")
  redirect(`/dashboard/invoices/${newInvoice.id}`)
}
