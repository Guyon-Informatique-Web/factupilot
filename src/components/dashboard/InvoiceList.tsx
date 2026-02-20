"use client"

// Liste des factures avec filtres, archivage et sélection multiple
import Link from "next/link"
import {
  updateInvoiceStatus,
  deleteInvoice,
  archiveInvoice,
  restoreInvoice,
  bulkDeleteInvoices,
  bulkArchiveInvoices,
} from "@/app/dashboard/invoices/actions"
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
  MoreHorizontal, Eye, Send, CreditCard, FileText, Search,
  Archive, RotateCcw, Trash2,
} from "lucide-react"
import { useState, useMemo } from "react"
import { toast } from "sonner"
import { useSelection } from "@/hooks/useSelection"
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog"
import { BulkActionBar } from "@/components/dashboard/BulkActionBar"

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
  archivedInvoices?: Invoice[]
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

export function InvoiceList({ invoices, archivedInvoices = [], vatRegime }: InvoiceListProps) {
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

  const handleStatusChange = async (invoiceId: string, status: "SENT" | "PAID" | "CANCELLED") => {
    setActionLoading(invoiceId)
    try {
      await updateInvoiceStatus(invoiceId, status)
    } catch {
      // Erreur gérée côté serveur
    }
    setActionLoading(null)
  }

  const handleDelete = (invoiceId: string) => {
    setConfirmDialog({
      open: true,
      title: "Supprimer ce brouillon",
      description: "Cette action est irréversible. Le brouillon sera définitivement supprimé.",
      confirmLabel: "Supprimer",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteInvoice(invoiceId)
          toast.success("Brouillon supprimé")
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression")
        }
        setConfirmDialog((prev) => ({ ...prev, open: false }))
      },
    })
  }

  const handleArchive = (invoiceId: string) => {
    setConfirmDialog({
      open: true,
      title: "Archiver cette facture",
      description: "La facture sera déplacée dans les archives. Rappel : les factures doivent être conservées pendant 10 ans (obligation légale). Vous pourrez la restaurer depuis l'onglet Archives.",
      confirmLabel: "Archiver",
      variant: "default",
      onConfirm: async () => {
        try {
          await archiveInvoice(invoiceId)
          toast.success("Facture archivée")
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Erreur lors de l'archivage")
        }
        setConfirmDialog((prev) => ({ ...prev, open: false }))
      },
    })
  }

  const handleRestore = async (invoiceId: string) => {
    setActionLoading(invoiceId)
    try {
      await restoreInvoice(invoiceId)
      toast.success("Facture restaurée")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la restauration")
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

  // Sélection multiple
  const selection = useSelection(filtered)

  // Déterminer les actions bulk disponibles selon les statuts sélectionnés
  const selectedStatuses = useMemo(() => {
    const statuses = new Set(selection.selectedItems.map((inv) => inv.status))
    return {
      hasDraft: statuses.has("DRAFT"),
      hasNonDraft: [...statuses].some((s) => s !== "DRAFT"),
    }
  }, [selection.selectedItems])

  const handleBulkDelete = () => {
    const draftIds = selection.selectedItems.filter((inv) => inv.status === "DRAFT").map((inv) => inv.id)
    setConfirmDialog({
      open: true,
      title: `Supprimer ${draftIds.length} brouillon${draftIds.length > 1 ? "s" : ""}`,
      description: "Cette action est irréversible. Les brouillons sélectionnés seront définitivement supprimés.",
      confirmLabel: "Supprimer",
      variant: "destructive",
      onConfirm: async () => {
        setBulkLoading(true)
        try {
          await bulkDeleteInvoices(draftIds)
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
    const nonDraftIds = selection.selectedItems.filter((inv) => inv.status !== "DRAFT").map((inv) => inv.id)
    setConfirmDialog({
      open: true,
      title: `Archiver ${nonDraftIds.length} facture${nonDraftIds.length > 1 ? "s" : ""}`,
      description: "Les factures sélectionnées seront déplacées dans les archives. Rappel : conservation obligatoire pendant 10 ans.",
      confirmLabel: "Archiver",
      variant: "default",
      onConfirm: async () => {
        setBulkLoading(true)
        try {
          await bulkArchiveInvoices(nonDraftIds)
          toast.success(`${nonDraftIds.length} facture${nonDraftIds.length > 1 ? "s" : ""} archivée${nonDraftIds.length > 1 ? "s" : ""}`)
          selection.clearSelection()
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Erreur lors de l'archivage")
        }
        setBulkLoading(false)
        setConfirmDialog((prev) => ({ ...prev, open: false }))
      },
    })
  }

  // Factures impayées (envoyées + en retard)
  const unpaidCount = filtered.filter((inv) => inv.status === "SENT" || inv.status === "OVERDUE").length

  const renderTable = (filteredInvoices: Invoice[], showCheckbox = true) => {
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
                  <TableRow key={invoice.id} className={selection.selectedIds.has(invoice.id) ? "bg-muted/50" : ""}>
                    {showCheckbox && (
                      <TableCell>
                        <Checkbox
                          checked={selection.selectedIds.has(invoice.id)}
                          onCheckedChange={() => selection.toggle(invoice.id)}
                        />
                      </TableCell>
                    )}
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
                          {invoice.status === "DRAFT" ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(invoice.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleArchive(invoice.id)}>
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
    if (archivedInvoices.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Archive className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Aucune archive</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Les factures archivées apparaîtront ici.
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
              {archivedInvoices.map((invoice) => {
                const statusConfig = STATUS_CONFIG[invoice.status]
                return (
                  <TableRow key={invoice.id} className="opacity-75">
                    <TableCell className="font-mono text-sm">{invoice.number}</TableCell>
                    <TableCell className="font-medium">{invoice.client.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {invoice.subject || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="font-medium">
                      {vatRegime === "FRANCHISE" ? formatEuro(invoice.totalHt) : formatEuro(invoice.totalTtc)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={actionLoading === invoice.id}
                        onClick={() => handleRestore(invoice.id)}
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

  // Actions groupées disponibles
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
          <TabsTrigger value="all">Toutes ({filtered.length})</TabsTrigger>
          <TabsTrigger value="unpaid">Impayées ({unpaidCount})</TabsTrigger>
          <TabsTrigger value="paid">Payées ({filterByStatus(filtered, "PAID").length})</TabsTrigger>
          <TabsTrigger value="draft">Brouillons ({filterByStatus(filtered, "DRAFT").length})</TabsTrigger>
          <TabsTrigger value="archived">Archives ({archivedInvoices.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">{renderTable(filtered)}</TabsContent>
        <TabsContent value="unpaid" className="mt-4">
          {renderTable(filtered.filter((inv) => inv.status === "SENT" || inv.status === "OVERDUE"))}
        </TabsContent>
        <TabsContent value="paid" className="mt-4">{renderTable(filterByStatus(filtered, "PAID"))}</TabsContent>
        <TabsContent value="draft" className="mt-4">{renderTable(filterByStatus(filtered, "DRAFT"))}</TabsContent>
        <TabsContent value="archived" className="mt-4">{renderArchivedTable()}</TabsContent>
      </Tabs>

      {/* Barre d'actions groupées */}
      <BulkActionBar
        count={selection.count}
        actions={bulkActions}
        onCancel={selection.clearSelection}
      />

      {/* Dialogue de confirmation */}
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
