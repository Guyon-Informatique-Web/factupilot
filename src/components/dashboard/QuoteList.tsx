"use client"

// Liste des devis avec filtres par statut et actions rapides
import Link from "next/link"
import { updateQuoteStatus } from "@/app/dashboard/quotes/actions"
import { createInvoiceFromQuote } from "@/app/dashboard/invoices/actions"
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
import { MoreHorizontal, Eye, Send, Check, X, FileText, Search } from "lucide-react"
import { useState, useMemo } from "react"

type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REFUSED" | "EXPIRED"

interface Quote {
  id: string
  number: string
  status: QuoteStatus
  date: Date
  validUntil: Date
  subject: string | null
  totalHt: number | { toNumber?: () => number }
  totalTtc: number | { toNumber?: () => number }
  client: { name: string }
}

interface QuoteListProps {
  quotes: Quote[]
  vatRegime: "FRANCHISE" | "NORMAL"
}

const STATUS_CONFIG: Record<QuoteStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  SENT: { label: "Envoyé", variant: "default" },
  ACCEPTED: { label: "Accepté", variant: "default" },
  REFUSED: { label: "Refusé", variant: "destructive" },
  EXPIRED: { label: "Expiré", variant: "outline" },
}

const formatEuro = (amount: number | { toNumber?: () => number }) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(amount))

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR").format(new Date(date))

export function QuoteList({ quotes, vatRegime }: QuoteListProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const handleStatusChange = async (quoteId: string, status: "SENT" | "ACCEPTED" | "REFUSED") => {
    setActionLoading(quoteId)
    try {
      await updateQuoteStatus(quoteId, status)
    } catch {
      // Erreur gérée côté serveur
    }
    setActionLoading(null)
  }

  // Filtrer par recherche (numéro, client, objet)
  const filtered = useMemo(() => {
    if (!search.trim()) return quotes
    const q = search.toLowerCase()
    return quotes.filter((quote) =>
      quote.number.toLowerCase().includes(q) ||
      quote.client.name.toLowerCase().includes(q) ||
      (quote.subject && quote.subject.toLowerCase().includes(q))
    )
  }, [quotes, search])

  const filterByStatus = (list: Quote[], status?: QuoteStatus) =>
    status ? list.filter((q) => q.status === status) : list

  const renderTable = (filteredQuotes: Quote[]) => {
    if (filteredQuotes.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Aucun devis</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Créez votre premier devis pour le retrouver ici.
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
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote) => {
                const statusConfig = STATUS_CONFIG[quote.status]
                return (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono text-sm">{quote.number}</TableCell>
                    <TableCell className="font-medium">{quote.client.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {quote.subject || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(quote.date)}</TableCell>
                    <TableCell className="font-medium">
                      {vatRegime === "FRANCHISE" ? formatEuro(quote.totalHt) : formatEuro(quote.totalTtc)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={actionLoading === quote.id}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/quotes/${quote.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir le détail
                            </Link>
                          </DropdownMenuItem>
                          {quote.status === "DRAFT" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(quote.id, "SENT")}>
                              <Send className="mr-2 h-4 w-4" />
                              Marquer envoyé
                            </DropdownMenuItem>
                          )}
                          {quote.status === "SENT" && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(quote.id, "ACCEPTED")}>
                                <Check className="mr-2 h-4 w-4" />
                                Marquer accepté
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(quote.id, "REFUSED")}>
                                <X className="mr-2 h-4 w-4" />
                                Marquer refusé
                              </DropdownMenuItem>
                            </>
                          )}
                          {quote.status === "ACCEPTED" && (
                            <DropdownMenuItem onClick={() => {
                              setActionLoading(quote.id)
                              createInvoiceFromQuote(quote.id).catch(() => {}).finally(() => setActionLoading(null))
                            }}>
                              <FileText className="mr-2 h-4 w-4" />
                              Convertir en facture
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
          <TabsTrigger value="all">Tous ({filtered.length})</TabsTrigger>
          <TabsTrigger value="draft">Brouillons ({filterByStatus(filtered, "DRAFT").length})</TabsTrigger>
          <TabsTrigger value="sent">Envoyés ({filterByStatus(filtered, "SENT").length})</TabsTrigger>
          <TabsTrigger value="accepted">Acceptés ({filterByStatus(filtered, "ACCEPTED").length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">{renderTable(filtered)}</TabsContent>
        <TabsContent value="draft" className="mt-4">{renderTable(filterByStatus(filtered, "DRAFT"))}</TabsContent>
        <TabsContent value="sent" className="mt-4">{renderTable(filterByStatus(filtered, "SENT"))}</TabsContent>
        <TabsContent value="accepted" className="mt-4">{renderTable(filterByStatus(filtered, "ACCEPTED"))}</TabsContent>
      </Tabs>
    </div>
  )
}
