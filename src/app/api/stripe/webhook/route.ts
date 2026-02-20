// Webhook Stripe — gestion des événements d'abonnement
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { withErrorHandling } from "@/lib/api-error-handler"
import type Stripe from "stripe"
import type { Plan } from "@/generated/prisma/client"

// Correspondance prix Stripe → plan FactuPilot
function getPlanFromPriceId(priceId: string): Plan {
  const mapping: Record<string, Plan> = {
    [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || ""]: "STARTER",
    [process.env.STRIPE_STARTER_YEARLY_PRICE_ID || ""]: "STARTER",
    [process.env.STRIPE_PRO_MONTHLY_PRICE_ID || ""]: "PRO",
    [process.env.STRIPE_PRO_YEARLY_PRICE_ID || ""]: "PRO",
    [process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || ""]: "BUSINESS",
    [process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || ""]: "BUSINESS",
  }
  return mapping[priceId] || "FREE"
}

async function handler(request: Request) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 })
  }

  switch (event.type) {
    // Nouvel abonnement créé
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id

      const priceId = subscription.items.data[0]?.price?.id || ""
      const plan = getPlanFromPriceId(priceId)

      // Déterminer le plan selon le statut de l'abonnement
      const isActive = subscription.status === "active" || subscription.status === "trialing"

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          stripeSubscriptionId: subscription.id,
          plan: isActive ? plan : "FREE",
        },
      })
      break
    }

    // Abonnement annulé ou expiré
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          stripeSubscriptionId: null,
          plan: "FREE",
        },
      })
      break
    }

    // Paiement réussi (renouvellement)
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice
      // Dans les versions récentes de Stripe, subscription est une string ou null
      const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string | null

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price?.id || ""
        const plan = getPlanFromPriceId(priceId)
        const customerId = typeof invoice.customer === "string"
          ? invoice.customer
          : null

        if (customerId) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { plan },
          })
        }
      }
      break
    }

    // Paiement échoué
    case "invoice.payment_failed": {
      // On ne downgrade pas immédiatement, Stripe retente automatiquement
      // Le downgrade se fait via customer.subscription.deleted si tous les retries échouent
      break
    }
  }

  return NextResponse.json({ received: true })
}

export const POST = withErrorHandling(handler, "WEBHOOK")
