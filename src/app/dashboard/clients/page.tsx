// Page liste des clients
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ClientDialog } from "@/components/dashboard/ClientDialog"
import { ClientList } from "@/components/dashboard/ClientList"

export const metadata = {
  title: "Clients",
}

export default async function ClientsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) redirect("/dashboard/onboarding")

  // Récupérer les clients actifs (non archivés)
  const clients = await prisma.client.findMany({
    where: {
      companyId: company.id,
      archivedAt: null,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            {clients.length} client{clients.length !== 1 ? "s" : ""} actif{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <ClientDialog />
      </div>
      <ClientList clients={clients} />
    </div>
  )
}
