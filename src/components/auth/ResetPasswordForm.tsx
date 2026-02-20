"use client"

// Formulaire de réinitialisation du mot de passe (après clic sur le lien email)
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react"

export function ResetPasswordForm() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation côté client
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.")
      return
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    setLoading(true)

    // Vérifier que l'utilisateur a bien une session active (établie par le callback)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError("Session expirée. Veuillez refaire une demande de réinitialisation.")
      setLoading(false)
      return
    }

    // Mettre à jour le mot de passe via Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      // Traduire les erreurs Supabase courantes
      if (updateError.message.includes("should be different")) {
        setError("Le nouveau mot de passe doit être différent de l'ancien.")
      } else {
        setError("Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.")
      }
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Redirection automatique vers le dashboard après 3 secondes
    setTimeout(() => {
      router.push("/dashboard")
    }, 3000)
  }

  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-green-500" />
          <CardTitle className="text-2xl font-bold">Mot de passe modifié</CardTitle>
          <CardDescription>
            Votre mot de passe a été réinitialisé avec succès.
            Redirection vers le tableau de bord...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Nouveau mot de passe</CardTitle>
        <CardDescription>
          Choisissez un nouveau mot de passe pour votre compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 8 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirmez votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Réinitialiser le mot de passe
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
