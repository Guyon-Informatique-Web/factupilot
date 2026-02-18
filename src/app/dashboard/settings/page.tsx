// Paramètres du compte et de l'entreprise
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/dashboard/SettingsForm"

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) redirect("/dashboard/onboarding")

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez les informations de votre entreprise et la personnalisation de vos documents.
        </p>
      </div>
      <SettingsForm
        company={{
          id: company.id,
          name: company.name,
          siret: company.siret,
          address: company.address,
          city: company.city,
          zipCode: company.zipCode,
          phone: company.phone,
          email: company.email,
          website: company.website,
          vatRegime: company.vatRegime,
          vatNumber: company.vatNumber,
          legalForm: company.legalForm,
          activityType: company.activityType,
          quotePrefix: company.quotePrefix,
          invoicePrefix: company.invoicePrefix,
          primaryColor: company.primaryColor,
          customNotes: company.customNotes,
        }}
      />
    </div>
  )
}
