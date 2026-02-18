// Page d'onboarding — Configuration du profil entreprise
import { OnboardingForm } from "@/components/dashboard/OnboardingForm"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Configuration de votre entreprise",
  description: "Configurez votre profil entreprise pour commencer à créer des devis et factures",
}

export default async function OnboardingPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  // Si l'utilisateur a déjà un profil entreprise, rediriger vers le dashboard
  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (company) redirect("/dashboard")

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Bienvenue sur FactuPilot</h1>
        <p className="text-muted-foreground">
          Configurez votre profil entreprise pour commencer à créer vos devis et factures.
          Vous pourrez modifier ces informations à tout moment dans les paramètres.
        </p>
      </div>
      <OnboardingForm userId={user.id} />
    </div>
  )
}
