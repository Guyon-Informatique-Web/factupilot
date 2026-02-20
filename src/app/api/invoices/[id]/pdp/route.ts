// Route API pour la gestion PDP d'une facture
// POST : soumettre au PDP — GET : récupérer le statut PDP
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { InvoicePdf } from "@/components/pdf/InvoicePdf"
import { getPlanLimits, type PlanType } from "@/config/plans"
import { generateFacturX } from "@/lib/facturx"
import { submitInvoiceToPdp, refreshPdpStatus } from "@/lib/pdp"
import { withErrorHandling } from "@/lib/api-error-handler"

async function postHandler(
  _request: Request,
  { params }: { params: Promise<Record<string, string>> }
) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  // Vérifier que le plan inclut Factur-X
  const limits = getPlanLimits(user.plan as PlanType)
  if (!limits.facturx) {
    return NextResponse.json(
      { error: "La transmission PDP nécessite un plan PRO ou BUSINESS" },
      { status: 403 }
    )
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
    },
  })
  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })
  }

  // Utiliser le XML existant ou en générer un nouveau
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
      where: { id: invoice.id },
      data: { facturxXml: xml },
    })
  }

  try {
    const result = await submitInvoiceToPdp(invoice.id, xml)
    return NextResponse.json({
      success: true,
      provider: result.provider,
      pdpInvoiceId: result.invoiceId,
      status: result.status,
    })
  } catch (err) {
    return NextResponse.json(
      { error: `Erreur soumission PDP : ${String(err)}` },
      { status: 502 }
    )
  }
}

async function getHandler(
  _request: Request,
  { params }: { params: Promise<Record<string, string>> }
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
    select: {
      id: true,
      pdpProvider: true,
      pdpInvoiceId: true,
      pdpStatus: true,
      pdpSubmittedAt: true,
      pdpError: true,
    },
  })
  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })
  }

  if (!invoice.pdpInvoiceId) {
    return NextResponse.json({
      submitted: false,
      pdpStatus: null,
    })
  }

  // Rafraîchir le statut depuis le PDP
  try {
    const statusText = await refreshPdpStatus(invoice.id)
    // Relire après mise à jour
    const updated = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      select: {
        pdpProvider: true,
        pdpInvoiceId: true,
        pdpStatus: true,
        pdpSubmittedAt: true,
        pdpError: true,
      },
    })
    return NextResponse.json({
      submitted: true,
      statusText,
      ...updated,
    })
  } catch (err) {
    return NextResponse.json({
      submitted: true,
      ...invoice,
      refreshError: String(err),
    })
  }
}

export const POST = withErrorHandling(postHandler, "API")
export const GET = withErrorHandling(getHandler, "API")
