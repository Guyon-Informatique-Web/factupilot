// Export CSV des devis
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

const UNIT_LABELS: Record<string, string> = {
  HOUR: "Heure",
  DAY: "Jour",
  UNIT: "Unité",
  FIXED: "Forfait",
  SQM: "m²",
  LM: "ml",
  KG: "kg",
  LOT: "Lot",
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  EXPIRED: "Expiré",
}

// Échapper une valeur CSV (guillemets doubles si nécessaire)
function escapeCsv(value: string | null | undefined): string {
  if (!value) return ""
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR").format(new Date(date))
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) return NextResponse.json({ error: "Entreprise non configurée" }, { status: 400 })

  const quotes = await prisma.quote.findMany({
    where: { companyId: company.id },
    include: {
      client: { select: { name: true } },
      items: { orderBy: { position: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  })

  // En-tête CSV
  const headers = [
    "Numéro",
    "Statut",
    "Client",
    "Objet",
    "Date de création",
    "Valide jusqu'au",
    "Description ligne",
    "Quantité",
    "Unité",
    "Prix unitaire HT",
    "Remise ligne %",
    "TVA %",
    "Total ligne HT",
    "Remise globale %",
    "Total HT devis",
    "Total TVA devis",
    "Total TTC devis",
  ]

  const rows: string[] = [headers.join(",")]

  for (const quote of quotes) {
    for (const item of quote.items) {
      const row = [
        escapeCsv(quote.number),
        escapeCsv(STATUS_LABELS[quote.status] || quote.status),
        escapeCsv(quote.client.name),
        escapeCsv(quote.subject),
        formatDate(quote.createdAt),
        formatDate(quote.validUntil),
        escapeCsv(item.description),
        String(Number(item.quantity)),
        escapeCsv(UNIT_LABELS[item.unit] || item.unit),
        String(Number(item.unitPriceHt)),
        String(Number(item.discountPercent)),
        String(Number(item.vatRate)),
        String(Number(item.totalHt)),
        String(Number(quote.discountPercent)),
        String(Number(quote.totalHt)),
        String(Number(quote.totalVat)),
        String(Number(quote.totalTtc)),
      ]
      rows.push(row.join(","))
    }
  }

  const csv = "\uFEFF" + rows.join("\n") // BOM UTF-8 pour Excel
  const filename = `devis-${new Date().toISOString().split("T")[0]}.csv`

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
