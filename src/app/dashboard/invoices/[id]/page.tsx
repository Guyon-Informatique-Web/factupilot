// Page de détail d'une facture
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { InvoiceActions } from "@/components/dashboard/InvoiceActions"
import Link from "next/link"

const formatEuro = (amount: number | { toNumber?: () => number }) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(amount))

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR").format(new Date(date))

const UNIT_LABELS: Record<string, string> = {
  HOUR: "h", DAY: "j", UNIT: "u", FIXED: "forfait",
  SQM: "m\u00B2", LM: "ml", KG: "kg", LOT: "lot",
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  SENT: { label: "Envoyée", variant: "default" },
  PAID: { label: "Payée", variant: "default" },
  OVERDUE: { label: "En retard", variant: "destructive" },
  CANCELLED: { label: "Annulée", variant: "outline" },
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) redirect("/dashboard/onboarding")

  const invoice = await prisma.invoice.findFirst({
    where: { id, companyId: company.id },
    include: {
      client: true,
      items: { orderBy: { position: "asc" } },
      quote: { select: { id: true, number: true } },
    },
  })

  if (!invoice) notFound()

  const statusConfig = STATUS_CONFIG[invoice.status]
  const isOverdue = invoice.status === "SENT" && new Date(invoice.dueDate) < new Date()
  const hasLineDiscount = invoice.items.some((item) => Number(item.discountPercent) > 0)
  const globalDiscount = Number(invoice.discountPercent)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Facture {invoice.number}</h1>
            <Badge variant={isOverdue ? "destructive" : statusConfig.variant}>
              {isOverdue ? "En retard" : statusConfig.label}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Émise le {formatDate(invoice.date)} — Échéance le {formatDate(invoice.dueDate)}
          </p>
          {invoice.quote && (
            <p className="text-sm text-muted-foreground">
              Issue du devis{" "}
              <Link href={`/dashboard/quotes/${invoice.quote.id}`} className="underline hover:text-foreground">
                {invoice.quote.number}
              </Link>
            </p>
          )}
        </div>
        <InvoiceActions invoiceId={invoice.id} status={invoice.status} hasClientEmail={!!invoice.client.email} />
      </div>

      {/* Infos émetteur + client */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Émetteur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-semibold">{company.name}</p>
            {company.address && <p>{company.address}</p>}
            {(company.zipCode || company.city) && (
              <p>{[company.zipCode, company.city].filter(Boolean).join(" ")}</p>
            )}
            {company.siret && <p className="text-muted-foreground">SIRET : {company.siret}</p>}
            {company.email && <p>{company.email}</p>}
            {company.phone && <p>{company.phone}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-semibold">{invoice.client.name}</p>
            {invoice.client.address && <p>{invoice.client.address}</p>}
            {(invoice.client.zipCode || invoice.client.city) && (
              <p>{[invoice.client.zipCode, invoice.client.city].filter(Boolean).join(" ")}</p>
            )}
            {invoice.client.siret && <p className="text-muted-foreground">SIRET : {invoice.client.siret}</p>}
            {invoice.client.email && <p>{invoice.client.email}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Objet */}
      {invoice.subject && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Objet</p>
            <p className="font-medium">{invoice.subject}</p>
          </CardContent>
        </Card>
      )}

      {/* Lignes de prestation */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Description</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Prix unitaire HT</TableHead>
                {hasLineDiscount && <TableHead>Remise</TableHead>}
                <TableHead>TVA</TableHead>
                <TableHead className="text-right">Total HT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-pre-wrap">{item.description}</TableCell>
                  <TableCell>
                    {Number(item.quantity)} {UNIT_LABELS[item.unit] || item.unit}
                  </TableCell>
                  <TableCell>{formatEuro(item.unitPriceHt)}</TableCell>
                  {hasLineDiscount && (
                    <TableCell>
                      {Number(item.discountPercent) > 0 ? `${Number(item.discountPercent)}%` : "—"}
                    </TableCell>
                  )}
                  <TableCell>{Number(item.vatRate)}%</TableCell>
                  <TableCell className="text-right font-medium">{formatEuro(item.totalHt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Totaux */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 text-right">
            {globalDiscount > 0 && (
              <>
                <div className="flex justify-end gap-8">
                  <span className="text-muted-foreground">Sous-total HT</span>
                  <span className="w-32 font-medium">
                    {formatEuro(invoice.items.reduce((sum, item) => sum + Number(item.totalHt), 0))}
                  </span>
                </div>
                <div className="flex justify-end gap-8">
                  <span className="text-muted-foreground">Remise globale ({globalDiscount}%)</span>
                  <span className="w-32 font-medium text-destructive">
                    -{formatEuro(
                      invoice.items.reduce((sum, item) => sum + Number(item.totalHt), 0) - Number(invoice.totalHt)
                    )}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-end gap-8">
              <span className="text-muted-foreground">Total HT</span>
              <span className="w-32 font-medium">{formatEuro(invoice.totalHt)}</span>
            </div>
            {company.vatRegime === "NORMAL" && (
              <div className="flex justify-end gap-8">
                <span className="text-muted-foreground">TVA</span>
                <span className="w-32 font-medium">{formatEuro(invoice.totalVat)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-end gap-8">
              <span className="text-lg font-semibold">Total TTC</span>
              <span className="w-32 text-lg font-bold">{formatEuro(invoice.totalTtc)}</span>
            </div>
            {company.vatRegime === "FRANCHISE" && (
              <p className="text-xs text-muted-foreground">
                TVA non applicable, article 293 B du Code général des impôts
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Infos paiement (si payée) */}
      {invoice.status === "PAID" && invoice.paidAt && (
        <Card>
          <CardContent className="pt-6 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Paiement reçu</p>
            <p className="text-sm">
              {formatEuro(invoice.paidAmount ?? invoice.totalTtc)} le {formatDate(invoice.paidAt)}
              {invoice.paymentMethod && ` — ${invoice.paymentMethod}`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Notes</p>
            <p className="whitespace-pre-wrap text-sm">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
