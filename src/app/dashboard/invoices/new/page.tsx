// Page de création manuelle d'une facture
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { InvoiceEditor } from "@/components/dashboard/InvoiceEditor"

export default async function NewInvoicePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) redirect("/dashboard/onboarding")

  // Charger les clients actifs
  const clients = await prisma.client.findMany({
    where: { companyId: company.id, archivedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">Nouvelle facture</h1>
      <InvoiceEditor clients={clients} vatRegime={company.vatRegime} />
    </div>
  )
}
