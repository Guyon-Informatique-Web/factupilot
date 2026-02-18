"use client"

// Liste des factures avec filtres par statut et actions rapides
import Link from "next/link"
import { updateInvoiceStatus } from "@/app/dashboard/invoices/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Eye, Send, CreditCard, FileText, Search } from "lucide-react"
import { useState, useMemo } from "react"

type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED"

interface Invoice {
  id: string
  number: string
  status: InvoiceStatus
  date: Date
  dueDate: Date
  subject: string | null
  totalHt: number | { toNumber?: () => number }
  totalTtc: number | { toNumber?: () => number }
  client: { name: string }
}

interface InvoiceListProps {
  invoices: Invoice[]
  vatRegime: "FRANCHISE" | "NORMAL"
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  SENT: { label: "Envoyée", variant: "default" },
  PAID: { label: "Payée", variant: "default" },
  OVERDUE: { label: "En retard", variant: "destructive" },
  CANCELLED: { label: "Annulée", variant: "outline" },
}

const formatEuro = (amount: number | { toNumber?: () => number }) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(amount))

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR").format(new Date(date))

export function InvoiceList({ invoices, vatRegime }: InvoiceListProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const handleStatusChange = async (invoiceId: string, status: "SENT" | "PAID" | "CANCELLED") => {
    setActionLoading(invoiceId)
    try {
      await updateInvoiceStatus(invoiceId, status)
    } catch {
      // Erreur gérée côté serveur
    }
    setActionLoading(null)
  }

  // Filtrer par recherche (numéro, client, objet)
  const filtered = useMemo(() => {
    if (!search.trim()) return invoices
    const q = search.toLowerCase()
    return invoices.filter((inv) =>
      inv.number.toLowerCase().includes(q) ||
      inv.client.name.toLowerCase().includes(q) ||
      (inv.subject && inv.subject.toLowerCase().includes(q))
    )
  }, [invoices, search])

  const filterByStatus = (list: Invoice[], status?: InvoiceStatus) =>
    status ? list.filter((inv) => inv.status === status) : list

  // Factures impayées (envoyées + en retard)
  const unpaidCount = filtered.filter((inv) => inv.status === "SENT" || inv.status === "OVERDUE").length

  const renderTable = (filteredInvoices: Invoice[]) => {
    if (filteredInvoices.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Aucune facture</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Convertissez un devis accepté pour créer votre première facture.
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="hidden md:table-cell">Objet</TableHead>
                <TableHead className="hidden md:table-cell">Échéance</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => {
                const statusConfig = STATUS_CONFIG[invoice.status]
                const isOverdue = invoice.status === "SENT" && new Date(invoice.dueDate) < new Date()
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-sm">{invoice.number}</TableCell>
                    <TableCell className="font-medium">{invoice.client.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {invoice.subject || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className={isOverdue ? "text-destructive font-medium" : ""}>
                        {formatDate(invoice.dueDate)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {vatRegime === "FRANCHISE" ? formatEuro(invoice.totalHt) : formatEuro(invoice.totalTtc)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isOverdue ? "destructive" : statusConfig.variant}>
                        {isOverdue ? "En retard" : statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={actionLoading === invoice.id}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/invoices/${invoice.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir le détail
                            </Link>
                          </DropdownMenuItem>
                          {invoice.status === "DRAFT" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, "SENT")}>
                              <Send className="mr-2 h-4 w-4" />
                              Marquer envoyée
                            </DropdownMenuItem>
                          )}
                          {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
                            <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, "PAID")}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Marquer payée
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par numéro, client ou objet..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Toutes ({filtered.length})</TabsTrigger>
          <TabsTrigger value="unpaid">Impayées ({unpaidCount})</TabsTrigger>
          <TabsTrigger value="paid">Payées ({filterByStatus(filtered, "PAID").length})</TabsTrigger>
          <TabsTrigger value="draft">Brouillons ({filterByStatus(filtered, "DRAFT").length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">{renderTable(filtered)}</TabsContent>
        <TabsContent value="unpaid" className="mt-4">
          {renderTable(filtered.filter((inv) => inv.status === "SENT" || inv.status === "OVERDUE"))}
        </TabsContent>
        <TabsContent value="paid" className="mt-4">{renderTable(filterByStatus(filtered, "PAID"))}</TabsContent>
        <TabsContent value="draft" className="mt-4">{renderTable(filterByStatus(filtered, "DRAFT"))}</TabsContent>
      </Tabs>
    </div>
  )
}
