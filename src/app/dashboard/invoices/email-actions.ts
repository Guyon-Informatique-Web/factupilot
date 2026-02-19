"use server"

// Envoi de facture par email au client
// Si le plan inclut Factur-X, la pièce jointe est un PDF/A-3b avec XML embarqué
import { prisma } from "@/lib/prisma"
import { resend } from "@/lib/resend"
import { requireUser } from "@/lib/auth"
import { renderToBuffer } from "@react-pdf/renderer"
import { InvoicePdf } from "@/components/pdf/InvoicePdf"
import { revalidatePath } from "next/cache"
import { getPlanLimits, type PlanType } from "@/config/plans"
import { generateFacturX } from "@/lib/facturx"
import { submitInvoiceToPdp } from "@/lib/pdp"

export async function sendInvoiceByEmail(invoiceId: string) {
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
      quote: { select: { number: true } },
    },
  })
  if (!invoice) throw new Error("Facture introuvable")
  if (!invoice.client.email) throw new Error("Le client n'a pas d'adresse email configurée")

  // Générer le PDF standard
  const standardPdf = await renderToBuffer(
    InvoicePdf({ invoice, company, client: invoice.client })
  )

  // Tenter la conversion Factur-X si le plan le permet
  let finalPdf: Buffer = Buffer.from(standardPdf)
  let facturxXml: string | null = null
  const limits = getPlanLimits(user.plan as PlanType)

  if (limits.facturx) {
    try {
      const { xml, pdfBuffer } = await generateFacturX(
        invoice,
        company,
        new Uint8Array(standardPdf)
      )
      finalPdf = Buffer.from(pdfBuffer)
      facturxXml = xml

      // Stocker le XML en BDD (fire-and-forget)
      prisma.invoice.update({
        where: { id: invoice.id },
        data: { facturxXml: xml },
      }).catch((err) => console.error("[Factur-X] Erreur stockage XML :", err))
    } catch (err) {
      // Fallback vers le PDF standard, pas de crash
      console.error("[Factur-X] Erreur génération email, fallback PDF standard :", err)
    }
  }

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("fr-FR").format(new Date(date))

  const formatEuro = (amount: number | { toNumber?: () => number }) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(amount))

  const montant = company.vatRegime === "FRANCHISE"
    ? formatEuro(invoice.totalHt)
    : formatEuro(invoice.totalTtc)

  // Envoyer l'email
  await resend.emails.send({
    from: `${company.name} <${process.env.EMAIL_FROM || "noreply@factupilot.fr"}>`,
    to: invoice.client.email,
    subject: `Facture ${invoice.number}${invoice.subject ? ` — ${invoice.subject}` : ""}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a; margin-bottom: 4px;">Facture ${invoice.number}</h2>
        <p style="color: #6b7280; margin-top: 0;">De la part de ${company.name}</p>

        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0;">
          ${invoice.subject ? `<p style="margin: 0 0 8px 0;"><strong>Objet :</strong> ${invoice.subject}</p>` : ""}
          <p style="margin: 0 0 8px 0;"><strong>Montant :</strong> ${montant}</p>
          <p style="margin: 0 0 8px 0;"><strong>Date d'émission :</strong> ${formatDate(invoice.date)}</p>
          <p style="margin: 0;"><strong>Échéance :</strong> ${formatDate(invoice.dueDate)}</p>
        </div>

        <p style="color: #374151;">
          Bonjour,<br><br>
          Veuillez trouver ci-joint notre facture ${invoice.number}.
          Le règlement est attendu avant le ${formatDate(invoice.dueDate)}.
        </p>

        <p style="color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
          ${company.name}${company.phone ? ` — ${company.phone}` : ""}${company.email ? ` — ${company.email}` : ""}
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `${invoice.number}.pdf`,
        content: finalPdf,
      },
    ],
  })

  // Passer la facture en "Envoyée" si elle est encore en brouillon
  if (invoice.status === "DRAFT") {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "SENT", sentAt: new Date() },
    })
  }

  // Soumettre au PDP si Factur-X a été généré (fire-and-forget, ne bloque pas l'envoi email)
  if (facturxXml) {
    submitInvoiceToPdp(invoiceId, facturxXml)
      .then((result) => console.log(`[PDP] Facture ${invoice.number} soumise : ${result.status}`))
      .catch((err) => console.error(`[PDP] Erreur soumission ${invoice.number} :`, err))
  }

  revalidatePath("/dashboard/invoices")
  revalidatePath(`/dashboard/invoices/${invoiceId}`)
}
