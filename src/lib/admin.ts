// Utilitaire d'autorisation admin
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

// Vérifie que l'utilisateur est admin, redirige vers le dashboard sinon
export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (!user.isAdmin) redirect("/dashboard")
  return user
}
