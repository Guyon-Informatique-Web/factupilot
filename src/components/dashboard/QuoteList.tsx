"use client"

// Liste des devis avec filtres, archivage et sélection multiple
import Link from "next/link"
import {
  updateQuoteStatus,
  deleteQuote,
  archiveQuote,
  restoreQuote,
  bulkDeleteQuotes,
  bulkArchiveQuotes,
} from "@/app/dashboard/quotes/actions"
import { createInvoiceFromQuote } from "@/app/dashboard/invoices/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  MoreHorizontal, Eye, Send, Check, X, FileText, Search,
  Archive, RotateCcw, Trash2,
} from "lucide-react"
import { useState, useMemo } from "react"
import { toast } from "sonner"
import { useSelection } from "@/hooks/useSelection"
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog"
import { BulkActionBar } from "@/components/dashboard/BulkActionBar"

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
  archivedQuotes?: Quote[]
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

export function QuoteList({ quotes, archivedQuotes = [], vatRegime }: QuoteListProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)

  // Dialogue de confirmation
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    confirmLabel: string
    variant: "default" | "destructive"
    onConfirm: () => Promise<void>
  }>({ open: false, title: "", description: "", confirmLabel: "", variant: "default", onConfirm: async () => {} })

  const handleStatusChange = async (quoteId: string, status: "SENT" | "ACCEPTED" | "REFUSED") => {
    setActionLoading(quoteId)
    try {
      await updateQuoteStatus(quoteId, status)
    } catch {
      // Erreur gérée côté serveur
    }
    setActionLoading(null)
  }

  const handleDelete = (quoteId: string) => {
    setConfirmDialog({
      open: true,
      title: "Supprimer ce brouillon",
      description: "Cette action est irréversible. Le brouillon sera définitivement supprimé.",
      confirmLabel: "Supprimer",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteQuote(quoteId)
          toast.success("Brouillon supprimé")
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression")
        }
        setConfirmDialog((prev) => ({ ...prev, open: false }))
      },
    })
  }

  const handleArchive = (quoteId: string) => {
    setConfirmDialog({
      open: true,
      title: "Archiver ce devis",
      description: "Le devis sera déplacé dans les archives. Vous pourrez le restaurer depuis l'onglet Archives.",
      confirmLabel: "Archiver",
      variant: "default",
      onConfirm: async () => {
        try {
          await archiveQuote(quoteId)
          toast.success("Devis archivé")
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Erreur lors de l'archivage")
        }
        setConfirmDialog((prev) => ({ ...prev, open: false }))
      },
    })
  }

  const handleRestore = async (quoteId: string) => {
    setActionLoading(quoteId)
    try {
      await restoreQuote(quoteId)
      toast.success("Devis restauré")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la restauration")
    }
    setActionLoading(null)
  }

  // Filtrer par recherche
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

  // Sélection multiple
  const selection = useSelection(filtered)

  const selectedStatuses = useMemo(() => {
    const statuses = new Set(selection.selectedItems.map((q) => q.status))
    return {
      hasDraft: statuses.has("DRAFT"),
      hasNonDraft: [...statuses].some((s) => s !== "DRAFT"),
    }
  }, [selection.selectedItems])

  const handleBulkDelete = () => {
    const draftIds = selection.selectedItems.filter((q) => q.status === "DRAFT").map((q) => q.id)
    setConfirmDialog({
      open: true,
      title: `Supprimer ${draftIds.length} brouillon${draftIds.length > 1 ? "s" : ""}`,
      description: "Cette action est irréversible. Les brouillons sélectionnés seront définitivement supprimés.",
      confirmLabel: "Supprimer",
      variant: "destructive",
      onConfirm: async () => {
        setBulkLoading(true)
        try {
          await bulkDeleteQuotes(draftIds)
          toast.success(`${draftIds.length} brouillon${draftIds.length > 1 ? "s" : ""} supprimé${draftIds.length > 1 ? "s" : ""}`)
          selection.clearSelection()
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression")
        }
        setBulkLoading(false)
        setConfirmDialog((prev) => ({ ...prev, open: false }))
      },
    })
  }

  const handleBulkArchive = () => {
    const nonDraftIds = selection.selectedItems.filter((q) => q.status !== "DRAFT").map((q) => q.id)
    setConfirmDialog({
      open: true,
      title: `Archiver ${nonDraftIds.length} devis`,
      description: "Les devis sélectionnés seront déplacés dans les archives.",
      confirmLabel: "Archiver",
      variant: "default",
      onConfirm: async () => {
        setBulkLoading(true)
        try {
          await bulkArchiveQuotes(nonDraftIds)
          toast.success(`${nonDraftIds.length} devis archivé${nonDraftIds.length > 1 ? "s" : ""}`)
          selection.clearSelection()
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Erreur lors de l'archivage")
        }
        setBulkLoading(false)
        setConfirmDialog((prev) => ({ ...prev, open: false }))
      },
    })
  }

  const renderTable = (filteredQuotes: Quote[], showCheckbox = true) => {
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
                {showCheckbox && (
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selection.isAllSelected}
                      // @ts-expect-error — indeterminate n'est pas dans le type mais fonctionne
                      indeterminate={selection.isPartiallySelected}
                      onCheckedChange={() => selection.toggleAll()}
                    />
                  </TableHead>
                )}
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
                  <TableRow key={quote.id} className={selection.selectedIds.has(quote.id) ? "bg-muted/50" : ""}>
                    {showCheckbox && (
                      <TableCell>
                        <Checkbox
                          checked={selection.selectedIds.has(quote.id)}
                          onCheckedChange={() => selection.toggle(quote.id)}
                        />
                      </TableCell>
                    )}
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
                          {quote.status === "DRAFT" ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(quote.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleArchive(quote.id)}>
                                <Archive className="mr-2 h-4 w-4" />
                                Archiver
                              </DropdownMenuItem>
                            </>
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

  const renderArchivedTable = () => {
    if (archivedQuotes.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Archive className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Aucune archive</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Les devis archivés apparaîtront ici.
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
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedQuotes.map((quote) => {
                const statusConfig = STATUS_CONFIG[quote.status]
                return (
                  <TableRow key={quote.id} className="opacity-75">
                    <TableCell className="font-mono text-sm">{quote.number}</TableCell>
                    <TableCell className="font-medium">{quote.client.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {quote.subject || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="font-medium">
                      {vatRegime === "FRANCHISE" ? formatEuro(quote.totalHt) : formatEuro(quote.totalTtc)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={actionLoading === quote.id}
                        onClick={() => handleRestore(quote.id)}
                        title="Restaurer"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
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

  // Actions groupées
  const bulkActions = []
  if (selectedStatuses.hasDraft) {
    bulkActions.push({
      label: "Supprimer",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleBulkDelete,
      variant: "destructive" as const,
      loading: bulkLoading,
    })
  }
  if (selectedStatuses.hasNonDraft) {
    bulkActions.push({
      label: "Archiver",
      icon: <Archive className="h-4 w-4" />,
      onClick: handleBulkArchive,
      variant: "default" as const,
      loading: bulkLoading,
    })
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
          <TabsTrigger value="archived">Archives ({archivedQuotes.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">{renderTable(filtered)}</TabsContent>
        <TabsContent value="draft" className="mt-4">{renderTable(filterByStatus(filtered, "DRAFT"))}</TabsContent>
        <TabsContent value="sent" className="mt-4">{renderTable(filterByStatus(filtered, "SENT"))}</TabsContent>
        <TabsContent value="accepted" className="mt-4">{renderTable(filterByStatus(filtered, "ACCEPTED"))}</TabsContent>
        <TabsContent value="archived" className="mt-4">{renderArchivedTable()}</TabsContent>
      </Tabs>

      <BulkActionBar
        count={selection.count}
        actions={bulkActions}
        onCancel={selection.clearSelection}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  )
}
