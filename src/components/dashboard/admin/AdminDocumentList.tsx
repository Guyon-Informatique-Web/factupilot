"use client"

// Vue lecture seule de tous les documents (admin)
import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { FileText, Search } from "lucide-react"

interface AdminDocument {
  id: string
  type: "invoice" | "quote"
  number: string
  status: string
  clientName: string
  companyName: string
  totalTtc: number
  createdAt: Date
  archivedAt: Date | null
}

interface AdminDocumentListProps {
  invoices: AdminDocument[]
  quotes: AdminDocument[]
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyé(e)",
  PAID: "Payée",
  OVERDUE: "En retard",
  CANCELLED: "Annulée",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  EXPIRED: "Expiré",
}

const formatEuro = (amount: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount)

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR").format(new Date(date))

export function AdminDocumentList({ invoices, quotes }: AdminDocumentListProps) {
  const [search, setSearch] = useState("")

  const allDocs = useMemo(() => [...invoices, ...quotes], [invoices, quotes])

  const filtered = useMemo(() => {
    if (!search.trim()) return allDocs
    const q = search.toLowerCase()
    return allDocs.filter((doc) =>
      doc.number.toLowerCase().includes(q) ||
      doc.clientName.toLowerCase().includes(q) ||
      doc.companyName.toLowerCase().includes(q)
    )
  }, [allDocs, search])

  const renderTable = (docs: AdminDocument[]) => {
    if (docs.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Aucun document</h3>
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
                <TableHead>Type</TableHead>
                <TableHead>Numéro</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead className="hidden md:table-cell">Client</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((doc) => (
                <TableRow key={`${doc.type}-${doc.id}`} className={doc.archivedAt ? "opacity-50" : ""}>
                  <TableCell>
                    <Badge variant="outline">
                      {doc.type === "invoice" ? "Facture" : "Devis"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{doc.number}</TableCell>
                  <TableCell className="font-medium">{doc.companyName}</TableCell>
                  <TableCell className="hidden md:table-cell">{doc.clientName}</TableCell>
                  <TableCell className="font-medium">{formatEuro(doc.totalTtc)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {STATUS_LABELS[doc.status] ?? doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(doc.createdAt)}</TableCell>
                </TableRow>
              ))}
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
          placeholder="Rechercher par numéro, entreprise ou client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Tous ({filtered.length})</TabsTrigger>
          <TabsTrigger value="invoices">Factures ({invoices.length})</TabsTrigger>
          <TabsTrigger value="quotes">Devis ({quotes.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">{renderTable(filtered)}</TabsContent>
        <TabsContent value="invoices" className="mt-4">{renderTable(invoices)}</TabsContent>
        <TabsContent value="quotes" className="mt-4">{renderTable(quotes)}</TabsContent>
      </Tabs>
    </div>
  )
}
