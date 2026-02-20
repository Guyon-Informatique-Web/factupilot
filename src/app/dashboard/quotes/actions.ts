"use server"

// Server actions pour la gestion des devis
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import type { Unit } from "@/generated/prisma/client"
import { canCreateQuote } from "@/lib/plan-limits"
import { calculateItemTotals, calculateDocumentTotals } from "@/lib/calculations"

const quoteItemSchema = z.object({
  description: z.string().min(1, "Description requise"),
  quantity: z.number().positive("Quantité positive requise"),
  unit: z.string(),
  unitPriceHt: z.number().min(0, "Prix positif requis"),
  vatRate: z.number().min(0).max(100),
  discountPercent: z.number().min(0).max(100).default(0),
})

const quoteSchema = z.object({
  clientId: z.string().min(1, "Veuillez sélectionner un client"),
  subject: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  conditions: z.string().optional().or(z.literal("")),
  validUntil: z.string().min(1, "Date de validité requise"),
  discountPercent: z.number().min(0).max(100).default(0),
  items: z.array(quoteItemSchema).min(1, "Au moins une ligne est requise"),
})

export type QuoteFormData = z.infer<typeof quoteSchema>

// Récupérer la company et le user connecté
async function getUserCompany() {
  const user = await requireUser()
  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) throw new Error("Profil entreprise non configuré")
  return { company, user }
}

// Générer le numéro de devis suivant (ex: DE-2026-0001)
function generateQuoteNumber(prefix: string, nextNum: number): string {
  const year = new Date().getFullYear()
  const num = String(nextNum).padStart(4, "0")
  return `${prefix}-${year}-${num}`
}

export async function createQuote(data: QuoteFormData) {
  const { company, user } = await getUserCompany()

  // Vérifier les limites du plan
  const check = await canCreateQuote(user.id, user.plan)
  if (!check.allowed) throw new Error(check.message)

  const validated = quoteSchema.parse(data)

  // Calculer les totaux avec remise globale
  const docTotals = calculateDocumentTotals(validated.items, validated.discountPercent)

  // Générer le numéro de devis
  const number = generateQuoteNumber(company.quotePrefix, company.nextQuoteNum)

  // Créer le devis + lignes en transaction
  const quote = await prisma.$transaction(async (tx) => {
    // Incrémenter le compteur
    await tx.company.update({
      where: { id: company.id },
      data: { nextQuoteNum: { increment: 1 } },
    })

    // Créer le devis
    return await tx.quote.create({
      data: {
        companyId: company.id,
        clientId: validated.clientId,
        number,
        subject: validated.subject || null,
        notes: validated.notes || null,
        conditions: validated.conditions || null,
        validUntil: new Date(validated.validUntil),
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

  revalidatePath("/dashboard/quotes")
  redirect(`/dashboard/quotes/${quote.id}`)
}

// Mettre à jour un devis brouillon
export async function updateQuote(quoteId: string, data: QuoteFormData) {
  const { company } = await getUserCompany()
  const validated = quoteSchema.parse(data)

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, companyId: company.id },
  })
  if (!quote) throw new Error("Devis introuvable")
  if (quote.status !== "DRAFT") throw new Error("Seuls les brouillons peuvent être modifiés")

  // Calculer les totaux avec remise globale
  const docTotals = calculateDocumentTotals(validated.items, validated.discountPercent)

  await prisma.$transaction(async (tx) => {
    // Supprimer les anciennes lignes
    await tx.quoteItem.deleteMany({ where: { quoteId } })

    // Mettre à jour le devis + recréer les lignes
    await tx.quote.update({
      where: { id: quoteId },
      data: {
        clientId: validated.clientId,
        subject: validated.subject || null,
        notes: validated.notes || null,
        conditions: validated.conditions || null,
        validUntil: new Date(validated.validUntil),
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

  revalidatePath("/dashboard/quotes")
  redirect(`/dashboard/quotes/${quoteId}`)
}

export async function updateQuoteStatus(quoteId: string, status: "SENT" | "ACCEPTED" | "REFUSED") {
  const { company } = await getUserCompany()

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, companyId: company.id },
  })
  if (!quote) throw new Error("Devis introuvable")

  const updateData: Record<string, unknown> = { status }
  if (status === "SENT") updateData.sentAt = new Date()
  if (status === "ACCEPTED") updateData.acceptedAt = new Date()
  if (status === "REFUSED") updateData.refusedAt = new Date()

  await prisma.quote.update({
    where: { id: quoteId },
    data: updateData,
  })

  revalidatePath("/dashboard/quotes")
  revalidatePath(`/dashboard/quotes/${quoteId}`)
}

export async function deleteQuote(quoteId: string) {
  const { company } = await getUserCompany()

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, companyId: company.id },
  })
  if (!quote) throw new Error("Devis introuvable")

  // Seulement les brouillons peuvent être supprimés
  if (quote.status !== "DRAFT") {
    throw new Error("Seuls les brouillons peuvent être supprimés")
  }

  await prisma.quote.delete({
    where: { id: quoteId },
  })

  revalidatePath("/dashboard/quotes")
  redirect("/dashboard/quotes")
}

// Archiver un devis (non-DRAFT uniquement)
export async function archiveQuote(quoteId: string) {
  const { company } = await getUserCompany()

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, companyId: company.id },
  })
  if (!quote) throw new Error("Devis introuvable")
  if (quote.status === "DRAFT") throw new Error("Les brouillons doivent être supprimés, pas archivés")

  await prisma.quote.update({
    where: { id: quoteId },
    data: { archivedAt: new Date() },
  })

  revalidatePath("/dashboard/quotes")
}

// Restaurer un devis archivé
export async function restoreQuote(quoteId: string) {
  const { company } = await getUserCompany()

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, companyId: company.id },
  })
  if (!quote) throw new Error("Devis introuvable")

  await prisma.quote.update({
    where: { id: quoteId },
    data: { archivedAt: null },
  })

  revalidatePath("/dashboard/quotes")
}

// Archiver plusieurs devis (non-DRAFT uniquement)
export async function bulkArchiveQuotes(quoteIds: string[]) {
  const { company } = await getUserCompany()

  await prisma.quote.updateMany({
    where: {
      id: { in: quoteIds },
      companyId: company.id,
      status: { not: "DRAFT" },
    },
    data: { archivedAt: new Date() },
  })

  revalidatePath("/dashboard/quotes")
}

// Supprimer plusieurs devis brouillon
export async function bulkDeleteQuotes(quoteIds: string[]) {
  const { company } = await getUserCompany()

  await prisma.quote.deleteMany({
    where: {
      id: { in: quoteIds },
      companyId: company.id,
      status: "DRAFT",
    },
  })

  revalidatePath("/dashboard/quotes")
}

// Dupliquer un devis existant (crée un nouveau brouillon)
export async function duplicateQuote(quoteId: string) {
  const { company, user } = await getUserCompany()

  const check = await canCreateQuote(user.id, user.plan)
  if (!check.allowed) throw new Error(check.message)

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, companyId: company.id },
    include: { items: { orderBy: { position: "asc" } } },
  })
  if (!quote) throw new Error("Devis introuvable")

  const number = generateQuoteNumber(company.quotePrefix, company.nextQuoteNum)

  // Validité 30 jours à partir d'aujourd'hui
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 30)

  const newQuote = await prisma.$transaction(async (tx) => {
    await tx.company.update({
      where: { id: company.id },
      data: { nextQuoteNum: { increment: 1 } },
    })

    return await tx.quote.create({
      data: {
        companyId: company.id,
        clientId: quote.clientId,
        number,
        subject: quote.subject ? `${quote.subject} (copie)` : null,
        notes: quote.notes,
        conditions: quote.conditions,
        validUntil,
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

  revalidatePath("/dashboard/quotes")
  redirect(`/dashboard/quotes/${newQuote.id}`)
}
