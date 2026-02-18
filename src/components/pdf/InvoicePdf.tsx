// Template PDF pour les factures
import { Document, Page, View, Text } from "@react-pdf/renderer"
import { pdfStyles as s, UNIT_LABELS, formatEuroPdf, formatDatePdf, formatPostalCityPdf, DEFAULT_LEGAL_MENTIONS } from "./styles"

interface InvoicePdfProps {
  invoice: {
    number: string
    date: Date
    dueDate: Date
    subject: string | null
    notes: string | null
    discountPercent: number | { toNumber?: () => number }
    totalHt: number | { toNumber?: () => number }
    totalVat: number | { toNumber?: () => number }
    totalTtc: number | { toNumber?: () => number }
    paidAt: Date | null
    paidAmount: number | { toNumber?: () => number } | null
    paymentMethod: string | null
    items: Array<{
      description: string
      quantity: number | { toNumber?: () => number }
      unit: string
      unitPriceHt: number | { toNumber?: () => number }
      vatRate: number | { toNumber?: () => number }
      discountPercent: number | { toNumber?: () => number }
      totalHt: number | { toNumber?: () => number }
    }>
    quote?: { number: string } | null
  }
  company: {
    name: string
    siret: string | null
    address: string | null
    city: string | null
    zipCode: string | null
    phone: string | null
    email: string | null
    vatRegime: string
    vatNumber: string | null
    customNotes: string | null
  }
  client: {
    name: string
    siret: string | null
    address: string | null
    city: string | null
    zipCode: string | null
    email: string | null
  }
}

export function InvoicePdf({ invoice, company, client }: InvoicePdfProps) {
  // Déterminer si au moins une ligne a une remise > 0
  const hasLineDiscount = invoice.items.some((item) => Number(item.discountPercent) > 0)
  const globalDiscount = Number(invoice.discountPercent)

  // Sous-total HT (somme des lignes avant remise globale)
  const subtotalHt = invoice.items.reduce((sum, item) => sum + Number(item.totalHt), 0)

  // Détail TVA par taux (pour affichage dans les totaux)
  const vatByRate: Record<number, number> = {}
  for (const item of invoice.items) {
    const rate = Number(item.vatRate)
    if (rate > 0) {
      const itemVat = Number(item.totalHt) * rate / 100
      vatByRate[rate] = (vatByRate[rate] || 0) + itemVat
    }
  }
  // Appliquer la remise globale proportionnellement sur chaque taux
  if (globalDiscount > 0 && subtotalHt > 0) {
    const ratio = Number(invoice.totalHt) / subtotalHt
    for (const rate of Object.keys(vatByRate)) {
      vatByRate[Number(rate)] = Math.round(vatByRate[Number(rate)] * ratio * 100) / 100
    }
  }
  const vatRates = Object.keys(vatByRate).map(Number).sort((a, b) => a - b)
  const hasMultipleVatRates = vatRates.length > 1

  // Colonnes avec ou sans remise
  const colDesc = hasLineDiscount ? s.colDescDisc : s.colDesc
  const colQty = hasLineDiscount ? s.colQtyDisc : s.colQty
  const colUnit = hasLineDiscount ? s.colUnitDisc : s.colUnit
  const colVat = hasLineDiscount ? s.colVatDisc : s.colVat
  const colTotal = hasLineDiscount ? s.colTotalDisc : s.colTotal
  const colTtc = hasLineDiscount ? s.colTtcDisc : s.colTtc

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* En-tête */}
        <View style={s.header}>
          <View>
            <Text style={s.docTitle}>FACTURE</Text>
            <Text style={s.docNumber}>{invoice.number}</Text>
            {invoice.quote && (
              <Text style={{ fontSize: 8, color: "#9ca3af", marginTop: 2 }}>
                {`Réf. devis : ${invoice.quote.number}`}
              </Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" as const }}>
            <Text style={s.docDate}>{`Date d'émission : ${formatDatePdf(invoice.date)}`}</Text>
            <Text style={s.docDate}>{`Échéance : ${formatDatePdf(invoice.dueDate)}`}</Text>
          </View>
        </View>

        {/* Émetteur / Client */}
        <View style={s.partiesRow}>
          <View style={s.partyBlock}>
            <Text style={s.partyLabel}>Émetteur</Text>
            <Text style={s.partyName}>{company.name}</Text>
            {company.address && <Text style={s.partyDetail}>{company.address}</Text>}
            {(company.zipCode || company.city) && (
              <Text style={s.partyDetail}>
                {formatPostalCityPdf(company.zipCode, company.city)}
              </Text>
            )}
            {company.siret && <Text style={s.partyDetail}>{`SIRET : ${company.siret}`}</Text>}
            {company.vatNumber && <Text style={s.partyDetail}>{`TVA : ${company.vatNumber}`}</Text>}
            {company.phone && <Text style={s.partyDetail}>{company.phone}</Text>}
            {company.email && <Text style={s.partyDetail}>{company.email}</Text>}
          </View>
          <View style={s.partyBlock}>
            <Text style={s.partyLabel}>Client</Text>
            <Text style={s.partyName}>{client.name}</Text>
            {client.address && <Text style={s.partyDetail}>{client.address}</Text>}
            {(client.zipCode || client.city) && (
              <Text style={s.partyDetail}>
                {formatPostalCityPdf(client.zipCode, client.city)}
              </Text>
            )}
            {client.siret && <Text style={s.partyDetail}>{`SIRET : ${client.siret}`}</Text>}
            {client.email && <Text style={s.partyDetail}>{client.email}</Text>}
          </View>
        </View>

        {/* Objet */}
        {invoice.subject && (
          <View style={s.subjectBlock}>
            <Text style={s.subjectLabel}>Objet</Text>
            <Text style={s.subjectText}>{invoice.subject}</Text>
          </View>
        )}

        {/* Tableau des lignes */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, colDesc]}>Description</Text>
            <Text style={[s.tableHeaderCell, colQty]}>Qté</Text>
            <Text style={[s.tableHeaderCell, colUnit]}>Prix unit. HT</Text>
            {hasLineDiscount && (
              <Text style={[s.tableHeaderCell, s.colDiscDisc]}>Remise</Text>
            )}
            <Text style={[s.tableHeaderCell, colVat]}>TVA</Text>
            <Text style={[s.tableHeaderCell, colTotal]}>Total HT</Text>
            <Text style={[s.tableHeaderCell, colTtc]}>Total TTC</Text>
          </View>
          {invoice.items.map((item, index) => {
            const itemTotalHt = Number(item.totalHt)
            const itemTotalTtc = itemTotalHt + itemTotalHt * Number(item.vatRate) / 100
            return (
              <View style={s.tableRow} key={index}>
                <Text style={[s.tableCell, colDesc]}>{item.description}</Text>
                <Text style={[s.tableCell, colQty]}>
                  {`${Number(item.quantity)} ${UNIT_LABELS[item.unit] || item.unit}`}
                </Text>
                <Text style={[s.tableCell, colUnit]}>{formatEuroPdf(item.unitPriceHt)}</Text>
                {hasLineDiscount && (
                  <Text style={[s.tableCell, s.colDiscDisc]}>
                    {Number(item.discountPercent) > 0 ? `${Number(item.discountPercent)}%` : "\u2014"}
                  </Text>
                )}
                <Text style={[s.tableCell, colVat]}>{`${Number(item.vatRate)} %`}</Text>
                <Text style={[s.tableCell, colTotal]}>{formatEuroPdf(item.totalHt)}</Text>
                <Text style={[s.tableCell, colTtc]}>{formatEuroPdf(itemTotalTtc)}</Text>
              </View>
            )
          })}
        </View>

        {/* Totaux */}
        <View style={s.totalsBlock}>
          {globalDiscount > 0 && (
            <>
              <View style={s.totalsRow}>
                <Text style={s.totalsLabel}>Sous-total HT</Text>
                <Text style={s.totalsValue}>{formatEuroPdf(subtotalHt)}</Text>
              </View>
              <View style={s.totalsRow}>
                <Text style={s.totalsLabel}>{`Remise ${globalDiscount}%`}</Text>
                <Text style={s.totalsValue}>{`-${formatEuroPdf(subtotalHt - Number(invoice.totalHt))}`}</Text>
              </View>
            </>
          )}
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Total HT</Text>
            <Text style={s.totalsValue}>{formatEuroPdf(invoice.totalHt)}</Text>
          </View>
          {company.vatRegime === "NORMAL" && hasMultipleVatRates && vatRates.map((rate) => (
            <View style={s.totalsRow} key={rate}>
              <Text style={s.totalsLabel}>{`TVA ${rate} %`}</Text>
              <Text style={s.totalsValue}>{formatEuroPdf(vatByRate[rate])}</Text>
            </View>
          ))}
          {company.vatRegime === "NORMAL" && (
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Total TVA</Text>
              <Text style={s.totalsValue}>{formatEuroPdf(invoice.totalVat)}</Text>
            </View>
          )}
          <View style={[s.totalsRow, s.totalsSeparator]}>
            <Text style={s.totalsTtcLabel}>Total TTC</Text>
            <Text style={s.totalsTtcValue}>{formatEuroPdf(invoice.totalTtc)}</Text>
          </View>
          {company.vatRegime === "FRANCHISE" && (
            <View style={{ marginTop: 4 }}>
              <Text style={{ fontSize: 7, color: "#9ca3af" }}>
                {"TVA non applicable, article 293 B du Code général des impôts"}
              </Text>
            </View>
          )}
        </View>

        {/* Infos paiement si payée */}
        {invoice.paidAt && (
          <View style={[s.notesBlock, { backgroundColor: "#ecfdf5" }]}>
            <Text style={[s.notesLabel, { color: "#059669" }]}>Paiement reçu</Text>
            <Text style={[s.notesText, { color: "#065f46" }]}>
              {`${formatEuroPdf(invoice.paidAmount ?? invoice.totalTtc)} le ${formatDatePdf(invoice.paidAt)}${invoice.paymentMethod ? ` \u2014 ${invoice.paymentMethod}` : ""}`}
            </Text>
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={s.notesBlock}>
            <Text style={s.notesLabel}>Notes</Text>
            <Text style={s.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Mentions légales obligatoires */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 7, color: "#9ca3af", lineHeight: 1.4 }}>
            {"En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée, ainsi qu'une indemnité forfaitaire de 40 euros pour frais de recouvrement (art. L.441-10 et D.441-5 du Code de commerce)."}
          </Text>
        </View>

        {/* Informations complémentaires (customNotes ou mentions légales par défaut) */}
        <View style={[s.notesBlock, { marginTop: 10 }]}>
          <Text style={s.notesLabel}>Informations complémentaires</Text>
          <Text style={{ fontSize: 7, color: "#6b7280", lineHeight: 1.4 }}>
            {company.customNotes || DEFAULT_LEGAL_MENTIONS}
          </Text>
        </View>

        {/* Pied de page */}
        <Text style={s.footer}>
          {[
            company.name,
            company.siret ? `SIRET : ${company.siret}` : null,
            company.email,
            company.phone,
          ].filter(Boolean).join(" \u2014 ")}
        </Text>
      </Page>
    </Document>
  )
}
