// Vérification des limites de plan (quotas mensuels)
import { prisma } from "@/lib/prisma"
import { getPlanLimits, type PlanType } from "@/config/plans"

// Début du mois courant
function startOfMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

// Vérifier si l'utilisateur peut créer un devis
export async function canCreateQuote(userId: string, plan: PlanType): Promise<{ allowed: boolean; message?: string }> {
  const limits = getPlanLimits(plan)

  // -1 = illimité
  if (limits.maxQuotesPerMonth === -1) return { allowed: true }

  const company = await prisma.company.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!company) return { allowed: false, message: "Profil entreprise non configuré" }

  const count = await prisma.quote.count({
    where: {
      companyId: company.id,
      createdAt: { gte: startOfMonth() },
    },
  })

  if (count >= limits.maxQuotesPerMonth) {
    return {
      allowed: false,
      message: `Vous avez atteint la limite de ${limits.maxQuotesPerMonth} devis par mois sur le plan ${plan}. Passez à un plan supérieur pour créer plus de devis.`,
    }
  }

  return { allowed: true }
}

// Vérifier si l'utilisateur peut créer une facture
export async function canCreateInvoice(userId: string, plan: PlanType): Promise<{ allowed: boolean; message?: string }> {
  const limits = getPlanLimits(plan)

  if (limits.maxInvoicesPerMonth === -1) return { allowed: true }

  const company = await prisma.company.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!company) return { allowed: false, message: "Profil entreprise non configuré" }

  const count = await prisma.invoice.count({
    where: {
      companyId: company.id,
      createdAt: { gte: startOfMonth() },
    },
  })

  if (count >= limits.maxInvoicesPerMonth) {
    return {
      allowed: false,
      message: `Vous avez atteint la limite de ${limits.maxInvoicesPerMonth} factures par mois sur le plan ${plan}. Passez à un plan supérieur pour créer plus de factures.`,
    }
  }

  return { allowed: true }
}

// Vérifier si l'utilisateur peut ajouter un client
export async function canCreateClient(userId: string, plan: PlanType): Promise<{ allowed: boolean; message?: string }> {
  const limits = getPlanLimits(plan)

  if (limits.maxClients === -1) return { allowed: true }

  const company = await prisma.company.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!company) return { allowed: false, message: "Profil entreprise non configuré" }

  const count = await prisma.client.count({
    where: {
      companyId: company.id,
      archivedAt: null,
    },
  })

  if (count >= limits.maxClients) {
    return {
      allowed: false,
      message: `Vous avez atteint la limite de ${limits.maxClients} clients sur le plan ${plan}. Passez à un plan supérieur pour ajouter plus de clients.`,
    }
  }

  return { allowed: true }
}
