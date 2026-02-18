// Configuration générale de l'application FactuPilot

export const APP_CONFIG = {
  name: "FactuPilot",
  tagline: "Vos devis et factures en pilote automatique",
  taglineAlt: "Créez, envoyez, encaissez",
  description: "Créez, envoyez et suivez vos devis et factures en quelques clics. Propulsé par l'IA, conforme facturation électronique 2026.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  email: {
    from: process.env.EMAIL_FROM || "noreply@factupilot.fr",
    support: "support@factupilot.fr",
  },
  company: {
    name: "Guyon Informatique & Web",
    status: "Micro-entreprise",
    email: "contact@guyoninformatique.fr",
    website: "https://guyon-informatique-web.fr",
  },
  social: {
    twitter: "",
    linkedin: "",
    github: "",
  },
} as const
