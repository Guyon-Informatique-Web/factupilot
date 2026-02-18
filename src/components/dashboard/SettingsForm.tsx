"use client"

// Formulaire de paramètres entreprise
import { useState } from "react"
import { updateCompany, type UpdateCompanyInput } from "@/app/dashboard/settings/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2, Save, Check } from "lucide-react"
import { toast } from "sonner"

interface SettingsFormProps {
  company: UpdateCompanyInput & { id: string }
}

const VAT_LABELS = {
  FRANCHISE: "Franchise en base de TVA (art. 293 B)",
  NORMAL: "Assujetti à la TVA",
}

const LEGAL_FORM_LABELS = {
  EI: "Entrepreneur individuel (micro-entreprise)",
  EURL: "EURL",
  SASU: "SASU",
  SARL: "SARL",
  SAS: "SAS",
  OTHER: "Autre",
}

const ACTIVITY_LABELS = {
  ARTISAN_BTP: "Artisan BTP",
  FREELANCE_TECH: "Freelance / Tech",
  CONSULTANT: "Consultant / Formateur",
  COMMERCE: "Commerce / Vente",
  SERVICES: "Prestations de services",
  OTHER: "Autre",
}

export function SettingsForm({ company }: SettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<UpdateCompanyInput>({
    name: company.name,
    siret: company.siret,
    address: company.address,
    city: company.city,
    zipCode: company.zipCode,
    phone: company.phone,
    email: company.email,
    website: company.website,
    vatRegime: company.vatRegime,
    vatNumber: company.vatNumber,
    legalForm: company.legalForm,
    activityType: company.activityType,
    quotePrefix: company.quotePrefix,
    invoicePrefix: company.invoicePrefix,
    primaryColor: company.primaryColor,
    customNotes: company.customNotes,
  })

  const updateField = <K extends keyof UpdateCompanyInput>(key: K, value: UpdateCompanyInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)
    try {
      await updateCompany(form)
      toast.success("Paramètres enregistrés")
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la sauvegarde")
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>Ces informations apparaissent sur vos devis et factures.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Raison sociale *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siret">SIRET</Label>
              <Input
                id="siret"
                value={form.siret || ""}
                onChange={(e) => updateField("siret", e.target.value)}
                maxLength={14}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="legalForm">Forme juridique</Label>
              <Select value={form.legalForm} onValueChange={(v) => updateField("legalForm", v as UpdateCompanyInput["legalForm"])}>
                <SelectTrigger id="legalForm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEGAL_FORM_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="activityType">Type d&apos;activité</Label>
              <Select value={form.activityType} onValueChange={(v) => updateField("activityType", v as UpdateCompanyInput["activityType"])}>
                <SelectTrigger id="activityType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={form.address || ""}
              onChange={(e) => updateField("address", e.target.value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="zipCode">Code postal</Label>
              <Input
                id="zipCode"
                value={form.zipCode || ""}
                onChange={(e) => updateField("zipCode", e.target.value)}
                maxLength={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={form.city || ""}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email professionnel</Label>
              <Input
                id="email"
                type="email"
                value={form.email || ""}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={form.phone || ""}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Site web</Label>
            <Input
              id="website"
              value={form.website || ""}
              onChange={(e) => updateField("website", e.target.value)}
              placeholder="https://"
            />
          </div>
        </CardContent>
      </Card>

      {/* TVA */}
      <Card>
        <CardHeader>
          <CardTitle>Régime de TVA</CardTitle>
          <CardDescription>Détermine l&apos;affichage de la TVA sur vos documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vatRegime">Régime</Label>
              <Select value={form.vatRegime} onValueChange={(v) => updateField("vatRegime", v as UpdateCompanyInput["vatRegime"])}>
                <SelectTrigger id="vatRegime">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VAT_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.vatRegime === "NORMAL" && (
              <div className="space-y-2">
                <Label htmlFor="vatNumber">Numéro de TVA intracommunautaire</Label>
                <Input
                  id="vatNumber"
                  value={form.vatNumber || ""}
                  onChange={(e) => updateField("vatNumber", e.target.value)}
                  placeholder="FR XX XXXXXXXXX"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personnalisation documents */}
      <Card>
        <CardHeader>
          <CardTitle>Personnalisation des documents</CardTitle>
          <CardDescription>Préfixes de numérotation et mentions sur vos devis et factures.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quotePrefix">Préfixe devis</Label>
              <Input
                id="quotePrefix"
                value={form.quotePrefix}
                onChange={(e) => updateField("quotePrefix", e.target.value.toUpperCase())}
                maxLength={5}
                placeholder="DE"
              />
              <p className="text-xs text-muted-foreground">
                Ex : {form.quotePrefix}-2026-0001
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoicePrefix">Préfixe factures</Label>
              <Input
                id="invoicePrefix"
                value={form.invoicePrefix}
                onChange={(e) => updateField("invoicePrefix", e.target.value.toUpperCase())}
                maxLength={5}
                placeholder="FA"
              />
              <p className="text-xs text-muted-foreground">
                Ex : {form.invoicePrefix}-2026-0001
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryColor">Couleur principale</Label>
            <div className="flex items-center gap-3">
              <Input
                id="primaryColor"
                type="color"
                value={form.primaryColor || "#1e40af"}
                onChange={(e) => updateField("primaryColor", e.target.value)}
                className="h-10 w-16 cursor-pointer p-1"
              />
              <span className="text-sm text-muted-foreground">
                Utilisée dans les PDF générés
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customNotes">Mentions personnalisées</Label>
            <Textarea
              id="customNotes"
              value={form.customNotes || ""}
              onChange={(e) => updateField("customNotes", e.target.value)}
              rows={3}
              placeholder="Mentions supplémentaires ajoutées en bas de vos documents..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Bouton sauvegarder */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : saved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Sauvegardé
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
