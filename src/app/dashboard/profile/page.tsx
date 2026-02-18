// Page de profil utilisateur
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/dashboard/ProfileForm"

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Mon profil</h1>
      <ProfileForm
        user={{
          email: user.email ?? "",
          name: user.name ?? null,
        }}
      />
    </div>
  )
}
