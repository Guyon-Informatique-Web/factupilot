// Créer une session portail client Stripe (gérer abonnement, factures, annulation)
import { getCurrentUser } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { NextResponse } from "next/server"

export async function POST() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: "Aucun abonnement actif" }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/dashboard/billing`,
  })

  return NextResponse.json({ url: session.url })
}
