"use server"

// Envoi de facture par email au client
import { prisma } from "@/lib/prisma"
import { resend } from "@/lib/resend"
import { requireUser } from "@/lib/auth"
import { renderToBuffer } from "@react-pdf/renderer"
import { InvoicePdf } from "@/components/pdf/InvoicePdf"
import { revalidatePath } from "next/cache"

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

  // Générer le PDF
  const pdfBuffer = await renderToBuffer(
    InvoicePdf({ invoice, company, client: invoice.client })
  )

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
        content: Buffer.from(pdfBuffer),
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

  revalidatePath("/dashboard/invoices")
  revalidatePath(`/dashboard/invoices/${invoiceId}`)
}
