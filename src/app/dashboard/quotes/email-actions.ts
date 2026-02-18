"use server"

// Envoi de devis par email au client
import { prisma } from "@/lib/prisma"
import { resend } from "@/lib/resend"
import { requireUser } from "@/lib/auth"
import { renderToBuffer } from "@react-pdf/renderer"
import { QuotePdf } from "@/components/pdf/QuotePdf"
import { revalidatePath } from "next/cache"

export async function sendQuoteByEmail(quoteId: string) {
  const user = await requireUser()

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) throw new Error("Profil entreprise non configuré")

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, companyId: company.id },
    include: {
      client: true,
      items: { orderBy: { position: "asc" } },
    },
  })
  if (!quote) throw new Error("Devis introuvable")
  if (!quote.client.email) throw new Error("Le client n'a pas d'adresse email configurée")

  // Générer le PDF
  const pdfBuffer = await renderToBuffer(
    QuotePdf({ quote, company, client: quote.client })
  )

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("fr-FR").format(new Date(date))

  const formatEuro = (amount: number | { toNumber?: () => number }) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(amount))

  const montant = company.vatRegime === "FRANCHISE"
    ? formatEuro(quote.totalHt)
    : formatEuro(quote.totalTtc)

  // Envoyer l'email
  await resend.emails.send({
    from: `${company.name} <${process.env.EMAIL_FROM || "noreply@factupilot.fr"}>`,
    to: quote.client.email,
    subject: `Devis ${quote.number}${quote.subject ? ` — ${quote.subject}` : ""}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a; margin-bottom: 4px;">Devis ${quote.number}</h2>
        <p style="color: #6b7280; margin-top: 0;">De la part de ${company.name}</p>

        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0;">
          ${quote.subject ? `<p style="margin: 0 0 8px 0;"><strong>Objet :</strong> ${quote.subject}</p>` : ""}
          <p style="margin: 0 0 8px 0;"><strong>Montant :</strong> ${montant}</p>
          <p style="margin: 0 0 8px 0;"><strong>Date :</strong> ${formatDate(quote.date)}</p>
          <p style="margin: 0;"><strong>Valide jusqu'au :</strong> ${formatDate(quote.validUntil)}</p>
        </div>

        <p style="color: #374151;">
          Bonjour,<br><br>
          Veuillez trouver ci-joint notre devis ${quote.number}.
          N'hésitez pas à nous contacter pour toute question.
        </p>

        <p style="color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
          ${company.name}${company.phone ? ` — ${company.phone}` : ""}${company.email ? ` — ${company.email}` : ""}
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `${quote.number}.pdf`,
        content: Buffer.from(pdfBuffer),
      },
    ],
  })

  // Passer le devis en "Envoyé" s'il est encore en brouillon
  if (quote.status === "DRAFT") {
    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: "SENT", sentAt: new Date() },
    })
  }

  revalidatePath("/dashboard/quotes")
  revalidatePath(`/dashboard/quotes/${quoteId}`)
}
