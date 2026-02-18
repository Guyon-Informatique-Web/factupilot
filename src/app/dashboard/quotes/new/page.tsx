// Page de création d'un nouveau devis
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { QuoteEditor } from "@/components/dashboard/QuoteEditor"

export const metadata = {
  title: "Nouveau devis",
}

export default async function NewQuotePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) redirect("/dashboard/onboarding")

  // Récupérer les clients actifs pour le sélecteur
  const clients = await prisma.client.findMany({
    where: { companyId: company.id, archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nouveau devis</h1>
        <p className="text-muted-foreground">
          Créez un devis pour l&apos;envoyer à votre client.
        </p>
      </div>
      <QuoteEditor clients={clients} vatRegime={company.vatRegime} />
    </div>
  )
}
