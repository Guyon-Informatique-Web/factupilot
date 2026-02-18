// Route API pour générer le PDF d'une facture
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { InvoicePdf } from "@/components/pdf/InvoicePdf"

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

  const buffer = await renderToBuffer(
    InvoicePdf({ invoice, company, client: invoice.client })
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
    },
  })
}
