// Page principale du dashboard — Vue d'ensemble de l'activité
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
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
import { Euro, FileText, Clock, AlertTriangle, Plus } from "lucide-react"
import Link from "next/link"
import { RevenueChart } from "@/components/dashboard/RevenueChart"

const formatEuro = (amount: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount)

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR").format(new Date(date))

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) redirect("/dashboard/onboarding")

  // Début du mois et de l'année en cours
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  // 6 mois en arrière pour le graphique
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  // Requêtes en parallèle pour les stats
  const [
    invoicesPaidMonth,
    invoicesPaidYear,
    invoicesUnpaid,
    quotesWaiting,
    recentInvoices,
    recentQuotes,
    invoicesPaid6Months,
  ] = await Promise.all([
    // CA du mois (factures payées ce mois)
    prisma.invoice.findMany({
      where: {
        companyId: company.id,
        status: "PAID",
        paidAt: { gte: startOfMonth },
      },
      select: { totalTtc: true },
    }),
    // CA de l'année (factures payées cette année)
    prisma.invoice.findMany({
      where: {
        companyId: company.id,
        status: "PAID",
        paidAt: { gte: startOfYear },
      },
      select: { totalTtc: true },
    }),
    // Factures impayées (envoyées ou en retard)
    prisma.invoice.findMany({
      where: {
        companyId: company.id,
        status: { in: ["SENT", "OVERDUE"] },
      },
      select: { totalTtc: true, dueDate: true },
    }),
    // Devis en attente de réponse
    prisma.quote.count({
      where: {
        companyId: company.id,
        status: "SENT",
      },
    }),
    // 5 dernières factures
    prisma.invoice.findMany({
      where: { companyId: company.id },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // 5 derniers devis
    prisma.quote.findMany({
      where: { companyId: company.id },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Factures payées des 6 derniers mois (pour le graphique)
    prisma.invoice.findMany({
      where: {
        companyId: company.id,
        status: "PAID",
        paidAt: { gte: sixMonthsAgo },
      },
      select: { totalTtc: true, paidAt: true },
    }),
  ])

  // Calcul des montants
  const caMonth = invoicesPaidMonth.reduce((sum, inv) => sum + Number(inv.totalTtc), 0)
  const caYear = invoicesPaidYear.reduce((sum, inv) => sum + Number(inv.totalTtc), 0)
  const unpaidTotal = invoicesUnpaid.reduce((sum, inv) => sum + Number(inv.totalTtc), 0)
  const overdueCount = invoicesUnpaid.filter((inv) => new Date(inv.dueDate) < now).length

  // Données du graphique : CA par mois sur les 6 derniers mois
  const MONTH_NAMES = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]
  const chartData: { month: string; ca: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${d.getFullYear()}-${d.getMonth()}`
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
    const monthTotal = invoicesPaid6Months
      .filter((inv) => {
        if (!inv.paidAt) return false
        const paid = new Date(inv.paidAt)
        return `${paid.getFullYear()}-${paid.getMonth()}` === monthKey
      })
      .reduce((sum, inv) => sum + Number(inv.totalTtc), 0)
    chartData.push({ month: label, ca: Math.round(monthTotal * 100) / 100 })
  }

  // Seuil micro-entreprise (prestations de services 2026)
  const seuil = 77700
  const pourcentageSeuil = Math.round((caYear / seuil) * 100)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {user.name || user.email}
          </p>
        </div>
        <Link href="/dashboard/quotes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau devis
          </Button>
        </Link>
      </div>

      {/* Cartes statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA du mois</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatEuro(caMonth)}</div>
            <p className="text-xs text-muted-foreground">
              {formatEuro(caYear)} sur l&apos;année
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impayées</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatEuro(unpaidTotal)}</div>
            <p className="text-xs text-muted-foreground">
              {invoicesUnpaid.length} facture{invoicesUnpaid.length > 1 ? "s" : ""} en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devis en attente</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotesWaiting}</div>
            <p className="text-xs text-muted-foreground">
              En attente de réponse client
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seuil micro</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${pourcentageSeuil > 80 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pourcentageSeuil}%</div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div
                className={`h-2 rounded-full ${pourcentageSeuil > 80 ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${Math.min(pourcentageSeuil, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatEuro(caYear)} / {formatEuro(seuil)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerte factures en retard */}
      {overdueCount > 0 && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">
                {overdueCount} facture{overdueCount > 1 ? "s" : ""} en retard de paiement
              </p>
              <p className="text-sm text-muted-foreground">
                Pensez à relancer vos clients pour les échéances dépassées.
              </p>
            </div>
            <Link href="/dashboard/invoices" className="ml-auto">
              <Button variant="outline" size="sm">Voir les factures</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Graphique CA mensuel */}
      <RevenueChart data={chartData} />

      {/* Tableaux récents */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dernières factures */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Dernières factures</CardTitle>
            <Link href="/dashboard/invoices">
              <Button variant="ghost" size="sm">Voir tout</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentInvoices.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">
                Aucune facture pour le moment.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.map((inv) => {
                    const isOverdue = inv.status === "SENT" && new Date(inv.dueDate) < now
                    const statusKey = isOverdue ? "OVERDUE" : inv.status
                    const config = STATUS_LABELS[statusKey]
                    return (
                      <TableRow key={inv.id}>
                        <TableCell>
                          <Link href={`/dashboard/invoices/${inv.id}`} className="font-mono text-sm hover:underline">
                            {inv.number}
                          </Link>
                        </TableCell>
                        <TableCell>{inv.client.name}</TableCell>
                        <TableCell className="font-medium">
                          {formatEuro(Number(company.vatRegime === "FRANCHISE" ? inv.totalHt : inv.totalTtc))}
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

        {/* Derniers devis */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Derniers devis</CardTitle>
            <Link href="/dashboard/quotes">
              <Button variant="ghost" size="sm">Voir tout</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentQuotes.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">
                Aucun devis pour le moment.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentQuotes.map((q) => {
                    const config = STATUS_LABELS[q.status]
                    return (
                      <TableRow key={q.id}>
                        <TableCell>
                          <Link href={`/dashboard/quotes/${q.id}`} className="font-mono text-sm hover:underline">
                            {q.number}
                          </Link>
                        </TableCell>
                        <TableCell>{q.client.name}</TableCell>
                        <TableCell className="font-medium">
                          {formatEuro(Number(company.vatRegime === "FRANCHISE" ? q.totalHt : q.totalTtc))}
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
      </div>
    </div>
  )
}
