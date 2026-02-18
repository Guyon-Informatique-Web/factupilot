"use client"

// Dialog de création/édition d'un client
import { useState } from "react"
import { createClient, updateClient, type ClientFormData } from "@/app/dashboard/clients/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, Pencil } from "lucide-react"
import { toast } from "sonner"

interface ClientDialogProps {
  client?: {
    id: string
    name: string
    siret: string | null
    address: string | null
    city: string | null
    zipCode: string | null
    email: string | null
    phone: string | null
    notes: string | null
  }
}

export function ClientDialog({ client }: ClientDialogProps) {
  const isEditing = !!client
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(client?.name || "")
  const [siret, setSiret] = useState(client?.siret || "")
  const [address, setAddress] = useState(client?.address || "")
  const [city, setCity] = useState(client?.city || "")
  const [zipCode, setZipCode] = useState(client?.zipCode || "")
  const [email, setEmail] = useState(client?.email || "")
  const [phone, setPhone] = useState(client?.phone || "")
  const [notes, setNotes] = useState(client?.notes || "")

  const resetForm = () => {
    if (!isEditing) {
      setName("")
      setSiret("")
      setAddress("")
      setCity("")
      setZipCode("")
      setEmail("")
      setPhone("")
      setNotes("")
    }
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data: ClientFormData = {
      name, siret, address, city, zipCode, email, phone, notes,
    }

    try {
      if (isEditing) {
        await updateClient(client.id, data)
        toast.success("Client mis à jour")
      } else {
        await createClient(data)
        toast.success("Client créé")
      }
      setOpen(false)
      resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement")
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) resetForm() }}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau client
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier le client" : "Nouveau client"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations du client."
              : "Ajoutez un nouveau client à votre carnet d'adresses."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="clientName">Nom / Raison sociale *</Label>
            <Input
              id="clientName"
              placeholder="Ex: Entreprise Dupont"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientSiret">SIRET</Label>
              <Input
                id="clientSiret"
                placeholder="14 chiffres"
                value={siret}
                onChange={(e) => setSiret(e.target.value.replace(/\D/g, "").slice(0, 14))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Téléphone</Label>
              <Input
                id="clientPhone"
                type="tel"
                placeholder="06 12 34 56 78"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientEmail">Email</Label>
            <Input
              id="clientEmail"
              type="email"
              placeholder="contact@client.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientAddress">Adresse</Label>
            <Input
              id="clientAddress"
              placeholder="12 rue de la Paix"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientZipCode">Code postal</Label>
              <Input
                id="clientZipCode"
                placeholder="75001"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientCity">Ville</Label>
              <Input
                id="clientCity"
                placeholder="Paris"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientNotes">Notes internes</Label>
            <Textarea
              id="clientNotes"
              placeholder="Notes sur ce client (visible uniquement par vous)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Enregistrer" : "Créer le client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
