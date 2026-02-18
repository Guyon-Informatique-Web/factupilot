"use client"

// Éditeur de devis — formulaire complet avec lignes de prestation
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createQuote, updateQuote, type QuoteFormData } from "@/app/dashboard/quotes/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Loader2, Plus, Trash2, FileText } from "lucide-react"
import { toast } from "sonner"

interface Client {
  id: string
  name: string
}

interface QuoteEditorProps {
  clients: Client[]
  vatRegime: "FRANCHISE" | "NORMAL"
  // Mode édition : données initiales du devis existant
  editQuoteId?: string
  initialData?: {
    clientId: string
    subject: string
    notes: string
    conditions: string
    validUntil: string
    discountPercent: number
    items: QuoteItem[]
  }
}

interface QuoteItem {
  description: string
  quantity: number
  unit: string
  unitPriceHt: number
  vatRate: number
  discountPercent: number
}

const UNITS = [
  { value: "HOUR", label: "Heure" },
  { value: "DAY", label: "Jour" },
  { value: "UNIT", label: "Unité" },
  { value: "FIXED", label: "Forfait" },
  { value: "SQM", label: "m²" },
  { value: "LM", label: "ml" },
  { value: "KG", label: "kg" },
  { value: "LOT", label: "Lot" },
]

const VAT_RATES = [
  { value: 0, label: "0%" },
  { value: 5.5, label: "5,5%" },
  { value: 10, label: "10%" },
  { value: 20, label: "20%" },
]

// Date par défaut : 30 jours à partir d'aujourd'hui
function defaultValidUntil(): string {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().split("T")[0]
}

export function QuoteEditor({ clients, vatRegime, editQuoteId, initialData }: QuoteEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!editQuoteId

  const [clientId, setClientId] = useState(initialData?.clientId || "")
  const [subject, setSubject] = useState(initialData?.subject || "")
  const [notes, setNotes] = useState(initialData?.notes || "")
  const [conditions, setConditions] = useState(initialData?.conditions || "Paiement à réception de facture.")
  const [validUntil, setValidUntil] = useState(initialData?.validUntil || defaultValidUntil())
  const [globalDiscount, setGlobalDiscount] = useState(initialData?.discountPercent ?? 0)

  const defaultVatRate = vatRegime === "FRANCHISE" ? 0 : 20

  const [items, setItems] = useState<QuoteItem[]>(
    initialData?.items ?? [{ description: "", quantity: 1, unit: "UNIT", unitPriceHt: 0, vatRate: defaultVatRate, discountPercent: 0 }]
  )

  // Ajouter une ligne
  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unit: "UNIT", unitPriceHt: 0, vatRate: defaultVatRate, discountPercent: 0 }])
  }

  // Supprimer une ligne
  const removeItem = (index: number) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  // Mettre à jour une ligne
  const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  // Calculs des totaux avec remise ligne
  const calculateLineTotalHt = (item: QuoteItem) =>
    Math.round(item.quantity * item.unitPriceHt * (1 - item.discountPercent / 100) * 100) / 100

  // Sous-total HT (avant remise globale)
  const subtotalHt = items.reduce((sum, item) => sum + calculateLineTotalHt(item), 0)

  // Montant de la remise globale
  const globalDiscountAmount = Math.round(subtotalHt * (globalDiscount / 100) * 100) / 100

  // Total HT après remise globale
  const totalHt = Math.round((subtotalHt - globalDiscountAmount) * 100) / 100

  // TVA redistribuée proportionnellement
  const totalVat = (() => {
    if (subtotalHt === 0) return 0
    const ratio = globalDiscount > 0 ? totalHt / subtotalHt : 1
    return items.reduce((sum, item) => {
      const lineHt = calculateLineTotalHt(item)
      const lineVat = Math.round(lineHt * (item.vatRate / 100) * 100) / 100
      return sum + Math.round(lineVat * ratio * 100) / 100
    }, 0)
  })()

  const totalTtc = Math.round((totalHt + totalVat) * 100) / 100

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!clientId) {
      toast.error("Veuillez sélectionner un client")
      setLoading(false)
      return
    }

    const hasEmptyDescription = items.some((item) => !item.description.trim())
    if (hasEmptyDescription) {
      toast.error("Toutes les lignes doivent avoir une description")
      setLoading(false)
      return
    }

    const data: QuoteFormData = {
      clientId,
      subject,
      notes,
      conditions,
      validUntil,
      discountPercent: globalDiscount,
      items: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPriceHt: item.unitPriceHt,
        vatRate: item.vatRate,
        discountPercent: item.discountPercent,
      })),
    }

    try {
      if (isEditing) {
        await updateQuote(editQuoteId, data)
      } else {
        await createQuote(data)
      }
    } catch (err) {
      // Ne pas intercepter les redirections Next.js (lancées par redirect())
      if (typeof err === "object" && err !== null && "digest" in err) throw err
      toast.error(err instanceof Error ? err.message : isEditing
        ? "Erreur lors de la modification du devis"
        : "Erreur lors de la création du devis"
      )
      setLoading(false)
    }
  }

  // Formater un nombre en euros
  const formatEuro = (amount: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* En-tête du devis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Valide jusqu&apos;au *</Label>
              <Input
                id="validUntil"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Objet du devis</Label>
            <Input
              id="subject"
              placeholder="Ex: Rénovation salle de bain"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lignes de prestation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prestations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Ligne {index + 1}
                </span>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  placeholder="Décrivez la prestation ou la fourniture"
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <div className="space-y-2">
                  <Label>Quantité</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unité</Label>
                  <Select value={item.unit} onValueChange={(v) => updateItem(index, "unit", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prix unitaire HT</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPriceHt}
                    onChange={(e) => updateItem(index, "unitPriceHt", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Remise %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={item.discountPercent}
                    onChange={(e) => updateItem(index, "discountPercent", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>TVA</Label>
                  {vatRegime === "FRANCHISE" ? (
                    <Input value="0% (franchise)" disabled />
                  ) : (
                    <Select
                      value={String(item.vatRate)}
                      onValueChange={(v) => updateItem(index, "vatRate", parseFloat(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VAT_RATES.map((r) => (
                          <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="text-right text-sm font-medium">
                Total HT : {formatEuro(calculateLineTotalHt(item))}
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" className="w-full" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une ligne
          </Button>
        </CardContent>
      </Card>

      {/* Conditions et notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="conditions">Conditions de paiement</Label>
              <Input
                id="conditions"
                placeholder="Ex: Paiement à réception de facture"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="globalDiscount">Remise globale (%)</Label>
              <Input
                id="globalDiscount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={globalDiscount}
                onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes / remarques</Label>
            <Textarea
              id="notes"
              placeholder="Notes visibles par le client"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Récapitulatif des totaux */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 text-right">
            {globalDiscount > 0 && (
              <>
                <div className="flex justify-end gap-8">
                  <span className="text-muted-foreground">Sous-total HT</span>
                  <span className="w-32 font-medium">{formatEuro(subtotalHt)}</span>
                </div>
                <div className="flex justify-end gap-8">
                  <span className="text-muted-foreground">Remise globale ({globalDiscount}%)</span>
                  <span className="w-32 font-medium text-destructive">-{formatEuro(globalDiscountAmount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-end gap-8">
              <span className="text-muted-foreground">Total HT</span>
              <span className="w-32 font-medium">{formatEuro(totalHt)}</span>
            </div>
            {vatRegime === "NORMAL" && (
              <div className="flex justify-end gap-8">
                <span className="text-muted-foreground">TVA</span>
                <span className="w-32 font-medium">{formatEuro(totalVat)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-end gap-8">
              <span className="text-lg font-semibold">Total TTC</span>
              <span className="w-32 text-lg font-bold">{formatEuro(totalTtc)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Modification en cours..." : "Création en cours..."}
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              {isEditing ? "Enregistrer les modifications" : "Créer le devis"}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
