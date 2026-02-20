"use server"

// Server actions d'administration
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { Plan } from "@/generated/prisma/client"

// Vérifier que l'utilisateur est admin
async function requireAdminUser() {
  const user = await requireUser()
  if (!user.isAdmin) throw new Error("Accès non autorisé")
  return user
}

// Modifier le plan d'un utilisateur
export async function adminUpdateUserPlan(userId: string, plan: Plan) {
  await requireAdminUser()

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("Utilisateur introuvable")

  await prisma.user.update({
    where: { id: userId },
    data: { plan },
  })

  revalidatePath("/dashboard/admin/users")
}

// Basculer le statut admin d'un utilisateur
export async function adminToggleAdmin(userId: string) {
  const currentUser = await requireAdminUser()

  // Empêcher de retirer ses propres droits admin
  if (currentUser.id === userId) {
    throw new Error("Vous ne pouvez pas modifier vos propres droits admin")
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("Utilisateur introuvable")

  await prisma.user.update({
    where: { id: userId },
    data: { isAdmin: !user.isAdmin },
  })

  revalidatePath("/dashboard/admin/users")
}

// Supprimer un utilisateur et toutes ses données
export async function adminDeleteUser(userId: string) {
  const currentUser = await requireAdminUser()

  if (currentUser.id === userId) {
    throw new Error("Vous ne pouvez pas supprimer votre propre compte")
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("Utilisateur introuvable")

  // La cascade supprimera company → clients, quotes, invoices
  await prisma.user.delete({ where: { id: userId } })

  revalidatePath("/dashboard/admin/users")
}

// Marquer un log d'erreur comme résolu
export async function adminResolveLog(logId: string) {
  await requireAdminUser()

  const log = await prisma.errorLog.findUnique({ where: { id: logId } })
  if (!log) throw new Error("Log introuvable")

  await prisma.errorLog.update({
    where: { id: logId },
    data: { resolvedAt: new Date() },
  })

  revalidatePath("/dashboard/admin/logs")
}
