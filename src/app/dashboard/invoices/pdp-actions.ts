"use server"

// Actions serveur pour la gestion PDP (soumission manuelle, rafraîchissement statut)
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { renderToBuffer } from "@react-pdf/renderer"
import { InvoicePdf } from "@/components/pdf/InvoicePdf"
import { generateFacturX } from "@/lib/facturx"
import { submitInvoiceToPdp, refreshPdpStatus as refreshStatus } from "@/lib/pdp"
import { revalidatePath } from "next/cache"

/**
 * Soumet manuellement une facture au PDP.
 * Génère le Factur-X si pas encore fait, puis envoie au PDP.
 */
export async function submitToPdpAction(invoiceId: string) {
  const user = await requireUser()

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) throw new Error("Profil entreprise non configuré")

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, companyId: company.id },
    include: {
      client: true,
      items: { orderBy: { position: "asc" } },
    },
  })
  if (!invoice) throw new Error("Facture introuvable")

  // Utiliser le XML existant en BDD ou en générer un nouveau
  let xml = invoice.facturxXml
  if (!xml) {
    const standardPdf = await renderToBuffer(
      InvoicePdf({ invoice, company, client: invoice.client })
    )
    const result = await generateFacturX(
      invoice,
      company,
      new Uint8Array(standardPdf)
    )
    xml = result.xml

    // Stocker le XML en BDD
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { facturxXml: xml },
    })
  }

  // Soumettre au PDP
  const result = await submitInvoiceToPdp(invoiceId, xml)

  revalidatePath("/dashboard/invoices")
  revalidatePath(`/dashboard/invoices/${invoiceId}`)

  return {
    success: true,
    provider: result.provider,
    pdpInvoiceId: result.invoiceId,
    status: result.status,
  }
}

/**
 * Rafraîchit le statut PDP d'une facture depuis le PDP.
 */
export async function refreshPdpStatusAction(invoiceId: string) {
  const user = await requireUser()

  // Vérifier que la facture appartient bien à l'utilisateur
  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) throw new Error("Profil entreprise non configuré")

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, companyId: company.id },
    select: { id: true, pdpInvoiceId: true },
  })
  if (!invoice) throw new Error("Facture introuvable")
  if (!invoice.pdpInvoiceId) throw new Error("Cette facture n'a pas été soumise au PDP")

  const statusText = await refreshStatus(invoiceId)

  revalidatePath("/dashboard/invoices")
  revalidatePath(`/dashboard/invoices/${invoiceId}`)

  return { success: true, statusText }
}
