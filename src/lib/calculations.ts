// Fonctions de calcul partagées pour devis et factures
// Gère les remises ligne et globale avec redistribution de TVA

// Arrondi à 2 décimales
function round2(value: number): number {
  return Math.round(value * 100) / 100
}

// Calcul des totaux d'une ligne avec remise
export function calculateItemTotals(
  quantity: number,
  unitPriceHt: number,
  vatRate: number,
  discountPercent: number = 0
) {
  const totalHt = round2(quantity * unitPriceHt * (1 - discountPercent / 100))
  const totalVat = round2(totalHt * (vatRate / 100))
  return { totalHt, totalVat, totalTtc: round2(totalHt + totalVat) }
}

// Calcul des totaux du document (devis ou facture) avec remise globale
export function calculateDocumentTotals(
  items: Array<{
    quantity: number
    unitPriceHt: number
    vatRate: number
    discountPercent: number
  }>,
  globalDiscountPercent: number = 0
) {
  // Calculer les totaux par ligne
  let subtotalHt = 0
  const vatByRate = new Map<number, number>()

  for (const item of items) {
    const { totalHt, totalVat } = calculateItemTotals(
      item.quantity,
      item.unitPriceHt,
      item.vatRate,
      item.discountPercent
    )
    subtotalHt += totalHt

    // Grouper la TVA par taux pour redistribution proportionnelle
    const current = vatByRate.get(item.vatRate) || 0
    vatByRate.set(item.vatRate, current + totalVat)
  }

  // Appliquer la remise globale
  const discountAmount = round2(subtotalHt * (globalDiscountPercent / 100))
  const totalHt = round2(subtotalHt - discountAmount)

  // Redistribuer la TVA proportionnellement après remise globale
  let totalVat = 0
  if (globalDiscountPercent > 0 && subtotalHt > 0) {
    const ratio = totalHt / subtotalHt
    for (const [, vat] of vatByRate) {
      totalVat += round2(vat * ratio)
    }
  } else {
    for (const [, vat] of vatByRate) {
      totalVat += vat
    }
  }

  const totalTtc = round2(totalHt + totalVat)

  return { subtotalHt: round2(subtotalHt), discountAmount, totalHt, totalVat, totalTtc }
}
