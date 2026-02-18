// Styles partagés pour les templates PDF devis et factures
import { StyleSheet } from "@react-pdf/renderer"

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#1a1a1a",
  },

  // En-tête
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  docTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  docNumber: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  docDate: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
  },

  // Blocs émetteur / client
  partiesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 40,
  },
  partyBlock: {
    flex: 1,
  },
  partyLabel: {
    fontSize: 8,
    color: "#9ca3af",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 6,
  },
  partyName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  partyDetail: {
    fontSize: 9,
    color: "#4b5563",
    marginBottom: 2,
    letterSpacing: 0.2,
  },

  // Objet
  subjectBlock: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  subjectLabel: {
    fontSize: 8,
    color: "#9ca3af",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  subjectText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },

  // Tableau des lignes
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 8,
    paddingHorizontal: 6,
    minHeight: 30,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  tableCell: {
    fontSize: 9,
    color: "#374151",
  },
  // Largeurs des colonnes (5 colonnes standard)
  colDesc: { width: "42%" },
  colQty: { width: "12%", textAlign: "center" as const },
  colUnit: { width: "15%", textAlign: "right" as const },
  colVat: { width: "11%", textAlign: "center" as const },
  colTotal: { width: "20%", textAlign: "right" as const },

  // Largeurs des colonnes (6 colonnes avec remise)
  colDescDisc: { width: "35%" },
  colQtyDisc: { width: "10%", textAlign: "center" as const },
  colUnitDisc: { width: "14%", textAlign: "right" as const },
  colDiscDisc: { width: "10%", textAlign: "center" as const },
  colVatDisc: { width: "11%", textAlign: "center" as const },
  colTotalDisc: { width: "20%", textAlign: "right" as const },

  // Totaux
  totalsBlock: {
    alignItems: "flex-end" as const,
    marginBottom: 24,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
    width: 220,
  },
  totalsLabel: {
    fontSize: 10,
    color: "#6b7280",
    flex: 1,
  },
  totalsValue: {
    fontSize: 10,
    width: 100,
    textAlign: "right" as const,
  },
  totalsSeparator: {
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    paddingTop: 6,
    marginTop: 4,
  },
  totalsTtcLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    flex: 1,
  },
  totalsTtcValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    width: 100,
    textAlign: "right" as const,
  },

  // Mentions / notes
  notesBlock: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 8,
    color: "#9ca3af",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.5,
  },

  // Pied de page
  footer: {
    position: "absolute" as const,
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center" as const,
    fontSize: 7,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
  },
})

// Labels des unités
export const UNIT_LABELS: Record<string, string> = {
  HOUR: "h",
  DAY: "j",
  UNIT: "u",
  FIXED: "forfait",
  SQM: "m\u00B2",
  LM: "ml",
  KG: "kg",
  LOT: "lot",
}

// Mentions légales par défaut (affichées si l'utilisateur n'a pas de customNotes)
export const DEFAULT_LEGAL_MENTIONS =
  "Droit de rétractation : 14 jours (art. L.221-18 du Code de la consommation). " +
  "Garantie légale de conformité (art. L.217-4 à L.217-14) et garantie des vices cachés (art. 1641 à 1649 du Code civil). " +
  "Médiation de la consommation : le client peut recourir gratuitement à un médiateur."

// Formater un montant en euros (remplace les espaces Unicode par des espaces normaux pour react-pdf)
export function formatEuroPdf(amount: number | { toNumber?: () => number }): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(amount))
    .replace(/[\u00A0\u202F\u2009]/g, " ")
}

// Formater code postal + ville pour react-pdf (espaces Unicode remplacés)
export function formatPostalCityPdf(zipCode: string | null, city: string | null): string {
  return [zipCode, city].filter(Boolean).join(" ")
}

// Formater une date en français
export function formatDatePdf(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}
