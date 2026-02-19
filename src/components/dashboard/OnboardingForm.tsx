"use client"

// Formulaire d'onboarding — Configuration du profil entreprise
// Avec préremplissage automatique via l'API SIRENE
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createCompany } from "@/app/dashboard/onboarding/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, Search, Building2, MapPin, Briefcase, Info } from "lucide-react"

interface OnboardingFormProps {
  userId: string
}

export function OnboardingForm({ userId }: OnboardingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [siretLoading, setSiretLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [siretError, setSiretError] = useState<string | null>(null)

  // Champs du formulaire
  const [name, setName] = useState("")
  const [siret, setSiret] = useState("")
  const [siren, setSiren] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [vatRegime, setVatRegime] = useState<"FRANCHISE" | "NORMAL">("FRANCHISE")
  const [legalForm, setLegalForm] = useState<"EI" | "EURL" | "SASU" | "SARL" | "SAS" | "OTHER">("EI")
  const [activityType, setActivityType] = useState<"ARTISAN_BTP" | "FREELANCE_TECH" | "CONSULTANT" | "COMMERCE" | "SERVICES" | "OTHER">("OTHER")
  const [apeCode, setApeCode] = useState("")

  // Préremplissage via API SIRENE
  const handleSiretLookup = async () => {
    if (siret.length !== 14) {
      setSiretError("Le SIRET doit contenir exactement 14 chiffres")
      return
    }

    setSiretLoading(true)
    setSiretError(null)

    try {
      const response = await fetch(`/api/sirene?siret=${siret}`)
      const data = await response.json()

      if (!response.ok) {
        setSiretError(data.error || "Erreur lors de la recherche")
        setSiretLoading(false)
        return
      }

      // Préremplir les champs avec les données SIRENE
      if (data.name) setName(data.name)
      if (data.siren) setSiren(data.siren)
      if (data.address) setAddress(data.address)
      if (data.city) setCity(data.city)
      if (data.zipCode) setZipCode(data.zipCode)
      if (data.apeCode) setApeCode(data.apeCode)
    } catch {
      setSiretError("Erreur de connexion. Veuillez réessayer.")
    }

    setSiretLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFieldErrors({})

    try {
      const result = await createCompany({
        userId,
        name,
        siret: siret || "",
        siren: siren || "",
        address,
        city,
        zipCode,
        phone,
        email,
        website,
        vatRegime,
        legalForm,
        activityType,
        apeCode,
      })

      if (result.success) {
        // Redirect côté client — plus de redirect() dans le server action
        router.push("/dashboard")
        router.refresh()
      } else {
        setFieldErrors(result.errors)
        setError("Veuillez corriger les erreurs ci-dessous.")
        setLoading(false)
      }
    } catch {
      setError("Erreur lors de la création du profil. Veuillez réessayer.")
      setLoading(false)
    }
  }

  // Composant d'erreur de champ réutilisable
  const FieldError = ({ field }: { field: string }) => {
    if (!fieldErrors[field]) return null
    return <p className="text-sm text-destructive">{fieldErrors[field]}</p>
  }

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Section 1 : Identification par SIRET */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5" />
              Identification rapide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Entrez votre numéro SIRET pour préremplir automatiquement vos informations.
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Numéro SIRET (14 chiffres)"
                  value={siret}
                  onChange={(e) => {
                    setSiret(e.target.value.replace(/\D/g, "").slice(0, 14))
                    setFieldErrors((prev) => ({ ...prev, siret: "" }))
                  }}
                  maxLength={14}
                />
                <FieldError field="siret" />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleSiretLookup}
                disabled={siretLoading || siret.length !== 14}
              >
                {siretLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Rechercher"
                )}
              </Button>
            </div>
            {siretError && (
              <p className="text-sm text-destructive">{siretError}</p>
            )}
          </CardContent>
        </Card>

        {/* Section 2 : Informations entreprise */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Informations de l&apos;entreprise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom / Raison sociale *</Label>
              <Input
                id="name"
                placeholder="Ex: Dupont Plomberie"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setFieldErrors((prev) => ({ ...prev, name: "" }))
                }}
                required
              />
              <FieldError field="name" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="legalForm">Forme juridique</Label>
                <Select value={legalForm} onValueChange={(v) => setLegalForm(v as typeof legalForm)}>
                  <SelectTrigger id="legalForm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EI">Entrepreneur individuel (EI)</SelectItem>
                    <SelectItem value="EURL">EURL</SelectItem>
                    <SelectItem value="SASU">SASU</SelectItem>
                    <SelectItem value="SARL">SARL</SelectItem>
                    <SelectItem value="SAS">SAS</SelectItem>
                    <SelectItem value="OTHER">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="vatRegime">Régime TVA</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Franchise = micro-entrepreneur non assujetti (art. 293 B du CGI). Assujetti = vous facturez la TVA.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={vatRegime} onValueChange={(v) => setVatRegime(v as typeof vatRegime)}>
                  <SelectTrigger id="vatRegime">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FRANCHISE">Franchise (non assujetti)</SelectItem>
                    <SelectItem value="NORMAL">Assujetti à la TVA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="activityType">Type d&apos;activité</Label>
                <Select value={activityType} onValueChange={(v) => setActivityType(v as typeof activityType)}>
                  <SelectTrigger id="activityType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARTISAN_BTP">Artisan BTP</SelectItem>
                    <SelectItem value="FREELANCE_TECH">Freelance / Tech</SelectItem>
                    <SelectItem value="CONSULTANT">Consultant / Coach</SelectItem>
                    <SelectItem value="COMMERCE">Commerce</SelectItem>
                    <SelectItem value="SERVICES">Services</SelectItem>
                    <SelectItem value="OTHER">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="apeCode">Code APE</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Code attribué par l&apos;INSEE identifiant votre activité principale. Visible sur votre avis de situation SIRENE.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="apeCode"
                  placeholder="Ex: 4322A"
                  value={apeCode}
                  onChange={(e) => setApeCode(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email professionnel</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@monentreprise.fr"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setFieldErrors((prev) => ({ ...prev, email: "" }))
                  }}
                />
                <FieldError field="email" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Site web</Label>
              <Input
                id="website"
                placeholder="https://monentreprise.fr"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3 : Adresse */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" />
              Adresse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                placeholder="12 rue de la Paix"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">Code postal</Label>
                <Input
                  id="zipCode"
                  placeholder="75001"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  placeholder="Paris"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Bouton de soumission */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Briefcase className="mr-2 h-4 w-4" />
                Créer mon profil et commencer
              </>
            )}
          </Button>
        </div>
      </form>
    </TooltipProvider>
  )
}
