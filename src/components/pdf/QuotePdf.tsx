// Template PDF pour les devis
import { Document, Page, View, Text } from "@react-pdf/renderer"
import { pdfStyles as s, UNIT_LABELS, formatEuroPdf, formatDatePdf, formatPostalCityPdf, DEFAULT_LEGAL_MENTIONS } from "./styles"

interface QuotePdfProps {
  quote: {
    number: string
    date: Date
    validUntil: Date
    subject: string | null
    notes: string | null
    conditions: string | null
    discountPercent: number | { toNumber?: () => number }
    totalHt: number | { toNumber?: () => number }
    totalVat: number | { toNumber?: () => number }
    totalTtc: number | { toNumber?: () => number }
    items: Array<{
      description: string
      quantity: number | { toNumber?: () => number }
      unit: string
      unitPriceHt: number | { toNumber?: () => number }
      vatRate: number | { toNumber?: () => number }
      discountPercent: number | { toNumber?: () => number }
      totalHt: number | { toNumber?: () => number }
    }>
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

export function QuotePdf({ quote, company, client }: QuotePdfProps) {
  // Déterminer si au moins une ligne a une remise > 0
  const hasLineDiscount = quote.items.some((item) => Number(item.discountPercent) > 0)
  const globalDiscount = Number(quote.discountPercent)

  // Sous-total HT (somme des lignes avant remise globale)
  const subtotalHt = quote.items.reduce((sum, item) => sum + Number(item.totalHt), 0)

  // Colonnes avec ou sans remise
  const colDesc = hasLineDiscount ? s.colDescDisc : s.colDesc
  const colQty = hasLineDiscount ? s.colQtyDisc : s.colQty
  const colUnit = hasLineDiscount ? s.colUnitDisc : s.colUnit
  const colVat = hasLineDiscount ? s.colVatDisc : s.colVat
  const colTotal = hasLineDiscount ? s.colTotalDisc : s.colTotal

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* En-tête */}
        <View style={s.header}>
          <View>
            <Text style={s.docTitle}>DEVIS</Text>
            <Text style={s.docNumber}>{quote.number}</Text>
          </View>
          <View style={{ alignItems: "flex-end" as const }}>
            <Text style={s.docDate}>{`Date : ${formatDatePdf(quote.date)}`}</Text>
            <Text style={s.docDate}>{`Valide jusqu'au : ${formatDatePdf(quote.validUntil)}`}</Text>
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
        {quote.subject && (
          <View style={s.subjectBlock}>
            <Text style={s.subjectLabel}>Objet</Text>
            <Text style={s.subjectText}>{quote.subject}</Text>
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
          </View>
          {quote.items.map((item, index) => (
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
            </View>
          ))}
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
                <Text style={s.totalsValue}>{`-${formatEuroPdf(subtotalHt - Number(quote.totalHt))}`}</Text>
              </View>
            </>
          )}
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>Total HT</Text>
            <Text style={s.totalsValue}>{formatEuroPdf(quote.totalHt)}</Text>
          </View>
          {company.vatRegime === "NORMAL" && (
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>TVA</Text>
              <Text style={s.totalsValue}>{formatEuroPdf(quote.totalVat)}</Text>
            </View>
          )}
          <View style={[s.totalsRow, s.totalsSeparator]}>
            <Text style={s.totalsTtcLabel}>Total TTC</Text>
            <Text style={s.totalsTtcValue}>{formatEuroPdf(quote.totalTtc)}</Text>
          </View>
          {company.vatRegime === "FRANCHISE" && (
            <View style={{ marginTop: 4 }}>
              <Text style={{ fontSize: 7, color: "#9ca3af" }}>
                {"TVA non applicable, article 293 B du Code général des impôts"}
              </Text>
            </View>
          )}
        </View>

        {/* Conditions de paiement */}
        {quote.conditions && (
          <View style={s.notesBlock}>
            <Text style={s.notesLabel}>Conditions de paiement</Text>
            <Text style={s.notesText}>{quote.conditions}</Text>
          </View>
        )}

        {/* Notes */}
        {quote.notes && (
          <View style={[s.notesBlock, { marginTop: quote.conditions ? 8 : 10 }]}>
            <Text style={s.notesLabel}>Notes</Text>
            <Text style={s.notesText}>{quote.notes}</Text>
          </View>
        )}

        {/* Informations complémentaires (customNotes ou mentions légales par défaut) */}
        <View style={[s.notesBlock, { marginTop: 10 }]}>
          <Text style={s.notesLabel}>Informations complémentaires</Text>
          <Text style={{ fontSize: 7, color: "#6b7280", lineHeight: 1.4 }}>
            {company.customNotes || DEFAULT_LEGAL_MENTIONS}
          </Text>
        </View>

        {/* Mention signature */}
        <View style={{ marginTop: 20, flexDirection: "row", justifyContent: "flex-end" }}>
          <View style={{ width: 200, borderTopWidth: 1, borderTopColor: "#d1d5db", paddingTop: 8 }}>
            <Text style={{ fontSize: 8, color: "#6b7280", textAlign: "center" }}>
              {"Bon pour accord \u2014 Signature du client"}
            </Text>
          </View>
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
