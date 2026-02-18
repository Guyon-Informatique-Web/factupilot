"use client"

// Gestion de l'abonnement — affichage du plan actuel + upgrade/gestion
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PLANS, type PlanType } from "@/config/plans"
import { Check, Loader2, CreditCard, ArrowRight } from "lucide-react"

interface BillingManagerProps {
  currentPlan: PlanType
  hasSubscription: boolean
}

const PLAN_ORDER: PlanType[] = ["FREE", "STARTER", "PRO", "BUSINESS"]

export function BillingManager({ currentPlan, hasSubscription }: BillingManagerProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")

  const handleCheckout = async (planKey: PlanType) => {
    setLoading(planKey)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, billing }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      // Erreur gérée silencieusement
    }
    setLoading(null)
  }

  const handlePortal = async () => {
    setLoading("portal")
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      // Erreur gérée silencieusement
    }
    setLoading(null)
  }

  const plan = PLANS[currentPlan]

  return (
    <div className="space-y-6">
      {/* Plan actuel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            Plan actuel
            <Badge variant={currentPlan === "FREE" ? "secondary" : "default"}>
              {plan.name}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {plan.price === 0 ? "Gratuit" : `${plan.price.toFixed(2).replace(".", ",")} €/mois`}
              </p>
              <ul className="mt-2 space-y-1">
                {plan.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3 w-3 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            {hasSubscription && (
              <Button
                variant="outline"
                onClick={handlePortal}
                disabled={loading === "portal"}
              >
                {loading === "portal" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Gérer mon abonnement
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plans disponibles */}
      {currentPlan !== "BUSINESS" && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Changer de plan</h2>
            <div className="flex items-center gap-2 rounded-lg border p-1">
              <Button
                variant={billing === "monthly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setBilling("monthly")}
              >
                Mensuel
              </Button>
              <Button
                variant={billing === "yearly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setBilling("yearly")}
              >
                Annuel (-20%)
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {PLAN_ORDER.filter((k) => k !== "FREE").map((planKey) => {
              const p = PLANS[planKey]
              const isCurrent = planKey === currentPlan
              const price = billing === "yearly" && p.yearlyPrice
                ? p.yearlyPrice / 12
                : p.price
              const isPopular = planKey === "PRO"

              return (
                <Card
                  key={planKey}
                  className={`relative ${isPopular ? "border-primary" : ""} ${isCurrent ? "opacity-60" : ""}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Recommandé</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle>{p.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">
                        {price.toFixed(2).replace(".", ",")}
                      </span>
                      <span className="text-muted-foreground"> €/mois</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="mt-6 w-full"
                      variant={isPopular ? "default" : "outline"}
                      disabled={isCurrent || loading === planKey}
                      onClick={() => handleCheckout(planKey)}
                    >
                      {loading === planKey ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : isCurrent ? (
                        "Plan actuel"
                      ) : (
                        <>
                          Passer au {p.name}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
