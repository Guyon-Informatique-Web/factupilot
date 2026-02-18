// Plans tarifaires et limites FactuPilot

export type PlanType = "FREE" | "STARTER" | "PRO" | "BUSINESS"

export interface PlanLimits {
  maxQuotesPerMonth: number
  maxInvoicesPerMonth: number
  maxClients: number
  aiGenerationsPerMonth: number
  customBranding: boolean     // Logo + couleurs personnalisées
  autoReminders: boolean      // Relances automatiques
  facturx: boolean            // Export Factur-X
  onlinePayment: boolean      // Lien de paiement Stripe
  eSignature: boolean         // Signature électronique
  multiUser: boolean          // Multi-utilisateurs
  apiAccess: boolean          // Accès API
}

export interface PlanConfig {
  name: string
  price: number
  yearlyPrice?: number
  stripePriceIdMonthly?: string
  stripePriceIdYearly?: string
  limits: PlanLimits
  features: string[]
}

export const PLANS: Record<PlanType, PlanConfig> = {
  FREE: {
    name: "Gratuit",
    price: 0,
    limits: {
      maxQuotesPerMonth: 3,
      maxInvoicesPerMonth: 3,
      maxClients: 5,
      aiGenerationsPerMonth: 0,
      customBranding: false,
      autoReminders: false,
      facturx: false,
      onlinePayment: false,
      eSignature: false,
      multiUser: false,
      apiAccess: false,
    },
    features: [
      "3 devis par mois",
      "3 factures par mois",
      "5 clients",
      "Mentions légales automatiques",
      "Export PDF",
      "Envoi par email",
    ],
  },
  STARTER: {
    name: "Starter",
    price: 14.90,
    yearlyPrice: 142.80,
    stripePriceIdMonthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || "",
    stripePriceIdYearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || "",
    limits: {
      maxQuotesPerMonth: -1, // Illimité
      maxInvoicesPerMonth: -1,
      maxClients: -1,
      aiGenerationsPerMonth: 0,
      customBranding: true,
      autoReminders: false,
      facturx: false,
      onlinePayment: false,
      eSignature: false,
      multiUser: false,
      apiAccess: false,
    },
    features: [
      "Devis et factures illimités",
      "Clients illimités",
      "Logo et couleurs personnalisées",
      "Export PDF",
      "Envoi par email",
      "Modèles par métier",
      "Tableau de bord complet",
    ],
  },
  PRO: {
    name: "Pro",
    price: 24.90,
    yearlyPrice: 238.80,
    stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "",
    stripePriceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || "",
    limits: {
      maxQuotesPerMonth: -1,
      maxInvoicesPerMonth: -1,
      maxClients: -1,
      aiGenerationsPerMonth: 50,
      customBranding: true,
      autoReminders: true,
      facturx: true,
      onlinePayment: true,
      eSignature: false,
      multiUser: false,
      apiAccess: false,
    },
    features: [
      "Tout le plan Starter",
      "IA intégrée (50 générations/mois)",
      "Relances automatiques",
      "Facturation électronique Factur-X",
      "Paiement en ligne (Stripe)",
      "Suggestions de prix IA",
      "Détection d'erreurs IA",
    ],
  },
  BUSINESS: {
    name: "Business",
    price: 39.90,
    yearlyPrice: 382.80,
    stripePriceIdMonthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || "",
    stripePriceIdYearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || "",
    limits: {
      maxQuotesPerMonth: -1,
      maxInvoicesPerMonth: -1,
      maxClients: -1,
      aiGenerationsPerMonth: 200,
      customBranding: true,
      autoReminders: true,
      facturx: true,
      onlinePayment: true,
      eSignature: true,
      multiUser: true,
      apiAccess: true,
    },
    features: [
      "Tout le plan Pro",
      "IA étendue (200 générations/mois)",
      "Signature électronique",
      "Multi-utilisateurs",
      "Accès API",
      "Support prioritaire",
      "Export comptable (FEC)",
    ],
  },
} as const

// Utilitaire pour récupérer les limites d'un plan
export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLANS[plan].limits
}
