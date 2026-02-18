// Page d'édition d'une facture brouillon
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { InvoiceEditor } from "@/components/dashboard/InvoiceEditor"

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) redirect("/dashboard/onboarding")

  const invoice = await prisma.invoice.findFirst({
    where: { id, companyId: company.id },
    include: { items: { orderBy: { position: "asc" } } },
  })
  if (!invoice) notFound()

  // Seuls les brouillons peuvent être modifiés
  if (invoice.status !== "DRAFT") redirect(`/dashboard/invoices/${id}`)

  // Charger les clients actifs
  const clients = await prisma.client.findMany({
    where: { companyId: company.id, archivedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  // Préparer les données initiales pour le formulaire
  const initialData = {
    clientId: invoice.clientId,
    subject: invoice.subject ?? "",
    notes: invoice.notes ?? "",
    dueDate: invoice.dueDate.toISOString().split("T")[0],
    discountPercent: Number(invoice.discountPercent),
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unit: item.unit,
      unitPriceHt: Number(item.unitPriceHt),
      vatRate: Number(item.vatRate),
      discountPercent: Number(item.discountPercent),
    })),
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">Modifier la facture {invoice.number}</h1>
      <InvoiceEditor
        clients={clients}
        vatRegime={company.vatRegime}
        editInvoiceId={invoice.id}
        initialData={initialData}
      />
    </div>
  )
}
