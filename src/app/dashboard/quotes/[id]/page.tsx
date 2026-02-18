// Page de détail d'un devis
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
import { QuoteActions } from "@/components/dashboard/QuoteActions"

const formatEuro = (amount: number | { toNumber?: () => number }) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(amount))

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR").format(new Date(date))

const UNIT_LABELS: Record<string, string> = {
  HOUR: "h", DAY: "j", UNIT: "u", FIXED: "forfait",
  SQM: "m²", LM: "ml", KG: "kg", LOT: "lot",
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  SENT: { label: "Envoyé", variant: "default" },
  ACCEPTED: { label: "Accepté", variant: "default" },
  REFUSED: { label: "Refusé", variant: "destructive" },
  EXPIRED: { label: "Expiré", variant: "outline" },
}

export default async function QuoteDetailPage({
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

  const quote = await prisma.quote.findFirst({
    where: { id, companyId: company.id },
    include: {
      client: true,
      items: { orderBy: { position: "asc" } },
    },
  })

  if (!quote) notFound()

  const statusConfig = STATUS_CONFIG[quote.status]
  const hasLineDiscount = quote.items.some((item) => Number(item.discountPercent) > 0)
  const globalDiscount = Number(quote.discountPercent)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Devis {quote.number}</h1>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
          <p className="text-muted-foreground">
            Créé le {formatDate(quote.createdAt)} — Valide jusqu&apos;au {formatDate(quote.validUntil)}
          </p>
        </div>
        <QuoteActions quoteId={quote.id} status={quote.status} hasClientEmail={!!quote.client.email} />
      </div>

      {/* Infos client + entreprise */}
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
            <p className="font-semibold">{quote.client.name}</p>
            {quote.client.address && <p>{quote.client.address}</p>}
            {(quote.client.zipCode || quote.client.city) && (
              <p>{[quote.client.zipCode, quote.client.city].filter(Boolean).join(" ")}</p>
            )}
            {quote.client.siret && <p className="text-muted-foreground">SIRET : {quote.client.siret}</p>}
            {quote.client.email && <p>{quote.client.email}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Objet */}
      {quote.subject && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Objet</p>
            <p className="font-medium">{quote.subject}</p>
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
              {quote.items.map((item) => (
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
                    {formatEuro(quote.items.reduce((sum, item) => sum + Number(item.totalHt), 0))}
                  </span>
                </div>
                <div className="flex justify-end gap-8">
                  <span className="text-muted-foreground">Remise globale ({globalDiscount}%)</span>
                  <span className="w-32 font-medium text-destructive">
                    -{formatEuro(
                      quote.items.reduce((sum, item) => sum + Number(item.totalHt), 0) - Number(quote.totalHt)
                    )}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-end gap-8">
              <span className="text-muted-foreground">Total HT</span>
              <span className="w-32 font-medium">{formatEuro(quote.totalHt)}</span>
            </div>
            {company.vatRegime === "NORMAL" && (
              <div className="flex justify-end gap-8">
                <span className="text-muted-foreground">TVA</span>
                <span className="w-32 font-medium">{formatEuro(quote.totalVat)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-end gap-8">
              <span className="text-lg font-semibold">Total TTC</span>
              <span className="w-32 text-lg font-bold">{formatEuro(quote.totalTtc)}</span>
            </div>
            {company.vatRegime === "FRANCHISE" && (
              <p className="text-xs text-muted-foreground">
                TVA non applicable, article 293 B du Code général des impôts
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes et conditions */}
      {(quote.notes || quote.conditions) && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {quote.conditions && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conditions de paiement</p>
                <p className="text-sm">{quote.conditions}</p>
              </div>
            )}
            {quote.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                <p className="whitespace-pre-wrap text-sm">{quote.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
