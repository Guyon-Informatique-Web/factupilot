// Fiche client détaillée avec historique devis/factures
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, Mail, Phone, MapPin, Building, FileText, Plus } from "lucide-react"
import Link from "next/link"

const formatEuro = (amount: number | { toNumber?: () => number }) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(amount))

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR").format(new Date(date))

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  SENT: { label: "Envoyé", variant: "default" },
  ACCEPTED: { label: "Accepté", variant: "default" },
  REFUSED: { label: "Refusé", variant: "destructive" },
  EXPIRED: { label: "Expiré", variant: "outline" },
  PAID: { label: "Payée", variant: "default" },
  OVERDUE: { label: "En retard", variant: "destructive" },
  CANCELLED: { label: "Annulée", variant: "outline" },
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) redirect("/dashboard/onboarding")

  const client = await prisma.client.findFirst({
    where: { id, companyId: company.id },
  })
  if (!client) notFound()

  // Charger devis et factures de ce client
  const [quotes, invoices] = await Promise.all([
    prisma.quote.findMany({
      where: { clientId: id, companyId: company.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: { clientId: id, companyId: company.id },
      orderBy: { createdAt: "desc" },
    }),
  ])

  // Statistiques du client
  const totalFacture = invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + Number(inv.totalTtc), 0)
  const unpaidTotal = invoices
    .filter((inv) => inv.status === "SENT" || inv.status === "OVERDUE")
    .reduce((sum, inv) => sum + Number(inv.totalTtc), 0)

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            {client.siret && (
              <p className="text-sm text-muted-foreground">SIRET : {client.siret}</p>
            )}
          </div>
        </div>
        <Link href={`/dashboard/quotes/new?clientId=${client.id}`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau devis
          </Button>
        </Link>
      </div>

      {/* Informations + Statistiques */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Coordonnées */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Coordonnées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${client.phone}`} className="hover:underline">{client.phone}</a>
              </div>
            )}
            {(client.address || client.city) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {[client.address, client.zipCode, client.city].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            {client.siren && (
              <div className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>SIREN : {client.siren}</span>
              </div>
            )}
            {client.notes && (
              <div className="mt-4 rounded-lg bg-muted p-3">
                <p className="text-sm text-muted-foreground">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistiques */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Statistiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold">{quotes.length}</p>
                <p className="text-sm text-muted-foreground">Devis</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold">{invoices.length}</p>
                <p className="text-sm text-muted-foreground">Factures</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold">{formatEuro(totalFacture)}</p>
                <p className="text-sm text-muted-foreground">CA total</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold">{formatEuro(unpaidTotal)}</p>
                <p className="text-sm text-muted-foreground">Impayé</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devis du client */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Devis ({quotes.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">Aucun devis pour ce client</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead className="hidden md:table-cell">Objet</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q) => {
                  const config = STATUS_LABELS[q.status]
                  return (
                    <TableRow key={q.id}>
                      <TableCell>
                        <Link href={`/dashboard/quotes/${q.id}`} className="font-mono text-sm hover:underline">
                          {q.number}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {q.subject || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(q.createdAt)}</TableCell>
                      <TableCell className="font-medium">
                        {company.vatRegime === "FRANCHISE" ? formatEuro(q.totalHt) : formatEuro(q.totalTtc)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config?.variant ?? "secondary"}>{config?.label ?? q.status}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Factures du client */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Factures ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">Aucune facture pour ce client</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead className="hidden md:table-cell">Objet</TableHead>
                  <TableHead className="hidden md:table-cell">Échéance</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const isOverdue = inv.status === "SENT" && new Date(inv.dueDate) < new Date()
                  const statusKey = isOverdue ? "OVERDUE" : inv.status
                  const config = STATUS_LABELS[statusKey]
                  return (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <Link href={`/dashboard/invoices/${inv.id}`} className="font-mono text-sm hover:underline">
                          {inv.number}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {inv.subject || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className={isOverdue ? "text-destructive font-medium" : ""}>
                          {formatDate(inv.dueDate)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {company.vatRegime === "FRANCHISE" ? formatEuro(inv.totalHt) : formatEuro(inv.totalTtc)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config?.variant ?? "secondary"}>{config?.label ?? inv.status}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
