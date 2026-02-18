// Page de gestion de l'abonnement
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PLANS, type PlanType } from "@/config/plans"
import { BillingManager } from "@/components/dashboard/BillingManager"

export default async function BillingPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const currentPlan = (user.plan || "FREE") as PlanType

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Abonnement</h1>
        <p className="text-muted-foreground">
          Gérez votre plan et votre facturation.
        </p>
      </div>
      <BillingManager
        currentPlan={currentPlan}
        hasSubscription={!!user.stripeSubscriptionId}
      />
    </div>
  )
}
