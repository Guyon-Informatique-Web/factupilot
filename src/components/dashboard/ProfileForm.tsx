"use client"

// Formulaire de modification du profil utilisateur
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

interface ProfileFormProps {
  user: {
    email: string
    name: string | null
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name ?? "")
  const [loadingName, setLoadingName] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loadingPassword, setLoadingPassword] = useState(false)

  const supabase = createClient()

  // Mettre à jour le nom
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingName(true)

    const { error } = await supabase.auth.updateUser({
      data: { name },
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Nom mis à jour")
    }
    setLoadingName(false)
  }

  // Changer le mot de passe
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingPassword(true)

    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit faire au moins 8 caractères")
      setLoadingPassword(false)
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas")
      setLoadingPassword(false)
      return
    }

    // Vérifier l'ancien mot de passe en se reconnectant
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (signInError) {
      toast.error("Mot de passe actuel incorrect")
      setLoadingPassword(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Mot de passe modifié")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }
    setLoadingPassword(false)
  }

  return (
    <div className="space-y-6">
      {/* Nom */}
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>Votre nom affiché dans l&apos;application.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateName} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loadingName}>
                {loadingName ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Mot de passe */}
      <Card>
        <CardHeader>
          <CardTitle>Modifier le mot de passe</CardTitle>
          <CardDescription>Assurez-vous d&apos;utiliser un mot de passe d&apos;au moins 8 caractères.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loadingPassword}>
                {loadingPassword ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Changer le mot de passe
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
