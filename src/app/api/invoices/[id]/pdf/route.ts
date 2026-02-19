// Route API pour générer le PDF d'une facture
// Si le plan inclut Factur-X (PRO/BUSINESS), génère un PDF/A-3b avec XML embarqué
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { InvoicePdf } from "@/components/pdf/InvoicePdf"
import { getPlanLimits, type PlanType } from "@/config/plans"
import { generateFacturX } from "@/lib/facturx"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) {
    return NextResponse.json({ error: "Profil entreprise manquant" }, { status: 400 })
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id, companyId: company.id },
    include: {
      client: true,
      items: { orderBy: { position: "asc" } },
      quote: { select: { number: true } },
    },
  })
  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })
  }

  // Générer le PDF standard avec react-pdf
  const standardPdf = await renderToBuffer(
    InvoicePdf({ invoice, company, client: invoice.client })
  )

  // Vérifier si le plan inclut Factur-X
  const limits = getPlanLimits(user.plan as PlanType)
  if (limits.facturx) {
    try {
      const { xml, pdfBuffer } = await generateFacturX(
        invoice,
        company,
        new Uint8Array(standardPdf)
      )

      // Stocker le XML en BDD (fire-and-forget, ne bloque pas la réponse)
      prisma.invoice.update({
        where: { id: invoice.id },
        data: { facturxXml: xml },
      }).catch((err) => console.error("[Factur-X] Erreur stockage XML :", err))

      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
        },
      })
    } catch (err) {
      // Fallback vers le PDF standard si erreur Factur-X
      console.error("[Factur-X] Erreur génération, fallback PDF standard :", err)
    }
  }

  // PDF standard (plan FREE/STARTER ou fallback après erreur)
  return new NextResponse(new Uint8Array(standardPdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
    },
  })
}
