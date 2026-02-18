// Page d'édition d'un devis brouillon
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { QuoteEditor } from "@/components/dashboard/QuoteEditor"

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) redirect("/dashboard/onboarding")

  const quote = await prisma.quote.findFirst({
    where: { id, companyId: company.id },
    include: {
      items: { orderBy: { position: "asc" } },
    },
  })

  if (!quote) notFound()

  // Seuls les brouillons sont modifiables
  if (quote.status !== "DRAFT") {
    redirect(`/dashboard/quotes/${id}`)
  }

  // Charger les clients actifs
  const clients = await prisma.client.findMany({
    where: { companyId: company.id, archivedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">Modifier le devis {quote.number}</h1>
      <QuoteEditor
        clients={clients}
        vatRegime={company.vatRegime}
        editQuoteId={quote.id}
        initialData={{
          clientId: quote.clientId,
          subject: quote.subject || "",
          notes: quote.notes || "",
          conditions: quote.conditions || "",
          validUntil: new Date(quote.validUntil).toISOString().split("T")[0],
          discountPercent: Number(quote.discountPercent),
          items: quote.items.map((item) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unit: item.unit,
            unitPriceHt: Number(item.unitPriceHt),
            vatRate: Number(item.vatRate),
            discountPercent: Number(item.discountPercent),
          })),
        }}
      />
    </div>
  )
}
