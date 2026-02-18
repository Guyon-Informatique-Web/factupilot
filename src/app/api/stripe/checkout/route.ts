// Créer une session Stripe Checkout pour souscrire à un plan
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { PLANS, type PlanType } from "@/config/plans"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const { planKey, billing } = await request.json() as {
    planKey: PlanType
    billing: "monthly" | "yearly"
  }

  const plan = PLANS[planKey]
  if (!plan || planKey === "FREE") {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 })
  }

  const priceId = billing === "yearly"
    ? plan.stripePriceIdYearly
    : plan.stripePriceIdMonthly

  if (!priceId) {
    return NextResponse.json({ error: "Prix Stripe non configuré" }, { status: 400 })
  }

  // Créer ou récupérer le customer Stripe
  let customerId = user.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: { userId: user.id },
    })
    customerId = customer.id

    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgrade=success`,
    cancel_url: `${appUrl}/dashboard/billing`,
    metadata: { userId: user.id, planKey },
  })

  return NextResponse.json({ url: session.url })
}
