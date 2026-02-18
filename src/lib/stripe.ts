// Client Stripe — singleton lazy pour les appels côté serveur
import Stripe from "stripe"

let stripeInstance: Stripe | undefined

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("La variable d'environnement STRIPE_SECRET_KEY est requise")
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    })
  }
  return stripeInstance
}

// Proxy lazy : Stripe n'est instancié qu'au premier appel réel
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop: string | symbol) {
    return Reflect.get(getStripe(), prop)
  },
})
