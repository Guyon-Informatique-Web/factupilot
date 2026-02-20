// Export CSV des factures
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { withErrorHandling } from "@/lib/api-error-handler"

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
  SENT: "Envoyée",
  PAID: "Payée",
  OVERDUE: "En retard",
  CANCELLED: "Annulée",
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

async function handler() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) return NextResponse.json({ error: "Entreprise non configurée" }, { status: 400 })

  const invoices = await prisma.invoice.findMany({
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
    "Date d'échéance",
    "Description ligne",
    "Quantité",
    "Unité",
    "Prix unitaire HT",
    "Remise ligne %",
    "TVA %",
    "Total ligne HT",
    "Remise globale %",
    "Total HT facture",
    "Total TVA facture",
    "Total TTC facture",
    "Date de paiement",
    "Méthode de paiement",
  ]

  const rows: string[] = [headers.join(",")]

  for (const invoice of invoices) {
    for (const item of invoice.items) {
      const row = [
        escapeCsv(invoice.number),
        escapeCsv(STATUS_LABELS[invoice.status] || invoice.status),
        escapeCsv(invoice.client.name),
        escapeCsv(invoice.subject),
        formatDate(invoice.createdAt),
        formatDate(invoice.dueDate),
        escapeCsv(item.description),
        String(Number(item.quantity)),
        escapeCsv(UNIT_LABELS[item.unit] || item.unit),
        String(Number(item.unitPriceHt)),
        String(Number(item.discountPercent)),
        String(Number(item.vatRate)),
        String(Number(item.totalHt)),
        String(Number(invoice.discountPercent)),
        String(Number(invoice.totalHt)),
        String(Number(invoice.totalVat)),
        String(Number(invoice.totalTtc)),
        invoice.paidAt ? formatDate(invoice.paidAt) : "",
        escapeCsv(invoice.paymentMethod),
      ]
      rows.push(row.join(","))
    }
  }

  const csv = "\uFEFF" + rows.join("\n") // BOM UTF-8 pour Excel
  const filename = `factures-${new Date().toISOString().split("T")[0]}.csv`

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

export const GET = withErrorHandling(handler, "API")
