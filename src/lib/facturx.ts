// Génération Factur-X (profil BASIC) pour les factures FactuPilot
// Norme EN 16931 — Format CII (Cross Industry Invoice)
// Convertit une facture Prisma en XML CII + PDF/A-3b avec XML embarqué

import { zugferd, BASIC } from "node-zugferd"
import { XMLParser, XMLBuilder } from "fast-xml-parser"
import type { Company, Client, Invoice, InvoiceItem } from "@/generated/prisma/client"

// ============================================
// CONSTANTES
// ============================================

// Pays du vendeur (toujours France pour FactuPilot)
const SELLER_COUNTRY = "FR"

// Mention légale pour franchise en base de TVA
const FRANCHISE_TAX_REASON = "TVA non applicable, article 293 B du CGI"

// Mapping méthode de paiement → code UNTDID 4461
const PAYMENT_CODE_MAP: Record<string, string> = {
  virement: "30",
  carte: "48",
  chèque: "20",
  espèces: "10",
  prélèvement: "59",
}

// Mapping unité Prisma → code UN/CEFACT (Recommendation 20)
const UNIT_CODE_MAP: Record<string, string> = {
  HOUR: "HUR",
  DAY: "DAY",
  UNIT: "C62",
  FIXED: "C62",
  SQM: "MTK",
  LM: "MTR",
  KG: "KGM",
  LOT: "C62",
}

// ============================================
// TYPES
// ============================================

// Facture avec relations (telle que chargée dans les routes API)
type InvoiceWithRelations = Invoice & {
  items: InvoiceItem[]
  client: Client
}

// Résultat de la génération Factur-X
interface FacturXResult {
  xml: string
  pdfBuffer: Uint8Array
}

// Initialisation du générateur Factur-X (profil BASIC)
const invoicer = zugferd({ profile: BASIC })

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

// Arrondi à 2 décimales (cohérent avec calculations.ts)
function round2(value: number): number {
  return Math.round(value * 100) / 100
}

// Convertit un Decimal Prisma en number
function toNum(value: unknown): number {
  return Number(value)
}

// Convertit une unité Prisma en code UN/CEFACT
function toUnitCode(unit: string): string {
  return UNIT_CODE_MAP[unit] ?? "C62"
}

// Convertit une méthode de paiement en code UNTDID 4461
function toPaymentCode(method: string | null): string {
  if (!method) return "ZZZ"
  return PAYMENT_CODE_MAP[method.toLowerCase()] ?? "ZZZ"
}

// ============================================
// RÉORDONNANCEMENT XML (correctif node-zugferd v0.0.3)
// ============================================

// node-zugferd v0.0.3 génère les éléments XML dans un ordre incorrect
// par rapport au XSD CII. Cette fonction réordonne les éléments enfants
// de chaque parent selon l'ordre attendu par le schéma.

// Ordre correct des éléments enfants par parent (XSD Factur-X 1.07.2 BASIC)
// Source : Factur-X_1.07.2_BASIC.xsd + ReusableAggregateBusinessInformationEntity_100.xsd
const CII_ELEMENT_ORDER: Record<string, string[]> = {
  // CrossIndustryInvoiceType
  "rsm:CrossIndustryInvoice": [
    "rsm:ExchangedDocumentContext",
    "rsm:ExchangedDocument",
    "rsm:SupplyChainTradeTransaction",
  ],
  // ExchangedDocumentContextType
  "rsm:ExchangedDocumentContext": [
    "ram:BusinessProcessSpecifiedDocumentContextParameter",
    "ram:GuidelineSpecifiedDocumentContextParameter",
  ],
  // ExchangedDocumentType
  "rsm:ExchangedDocument": [
    "ram:ID", "ram:TypeCode", "ram:IssueDateTime", "ram:IncludedNote",
  ],
  // SupplyChainTradeTransactionType — lignes EN PREMIER dans Factur-X BASIC
  "rsm:SupplyChainTradeTransaction": [
    "ram:IncludedSupplyChainTradeLineItem",
    "ram:ApplicableHeaderTradeAgreement",
    "ram:ApplicableHeaderTradeDelivery",
    "ram:ApplicableHeaderTradeSettlement",
  ],
  // HeaderTradeAgreementType
  "ram:ApplicableHeaderTradeAgreement": [
    "ram:BuyerReference", "ram:SellerTradeParty", "ram:BuyerTradeParty",
    "ram:SellerTaxRepresentativeTradeParty",
    "ram:BuyerOrderReferencedDocument", "ram:ContractReferencedDocument",
  ],
  // TradePartyType (vendeur et acheteur — même type XSD)
  "ram:SellerTradeParty": [
    "ram:ID", "ram:GlobalID", "ram:Name",
    "ram:SpecifiedLegalOrganization", "ram:PostalTradeAddress",
    "ram:URIUniversalCommunication", "ram:SpecifiedTaxRegistration",
  ],
  "ram:BuyerTradeParty": [
    "ram:ID", "ram:GlobalID", "ram:Name",
    "ram:SpecifiedLegalOrganization", "ram:PostalTradeAddress",
    "ram:URIUniversalCommunication", "ram:SpecifiedTaxRegistration",
  ],
  // LegalOrganizationType
  "ram:SpecifiedLegalOrganization": [
    "ram:ID", "ram:TradingBusinessName",
  ],
  // TradeAddressType
  "ram:PostalTradeAddress": [
    "ram:PostcodeCode", "ram:LineOne", "ram:LineTwo", "ram:LineThree",
    "ram:CityName", "ram:CountryID", "ram:CountrySubDivisionName",
  ],
  // HeaderTradeDeliveryType
  "ram:ApplicableHeaderTradeDelivery": [
    "ram:ShipToTradeParty", "ram:ActualDeliverySupplyChainEvent",
    "ram:DespatchAdviceReferencedDocument",
  ],
  // HeaderTradeSettlementType
  "ram:ApplicableHeaderTradeSettlement": [
    "ram:CreditorReferenceID", "ram:PaymentReference", "ram:TaxCurrencyCode",
    "ram:InvoiceCurrencyCode", "ram:PayeeTradeParty",
    "ram:SpecifiedTradeSettlementPaymentMeans", "ram:ApplicableTradeTax",
    "ram:BillingSpecifiedPeriod", "ram:SpecifiedTradeAllowanceCharge",
    "ram:SpecifiedTradePaymentTerms",
    "ram:SpecifiedTradeSettlementHeaderMonetarySummation",
    "ram:InvoiceReferencedDocument",
    "ram:ReceivableSpecifiedTradeAccountingAccount",
  ],
  // TradeSettlementPaymentMeansType
  "ram:SpecifiedTradeSettlementPaymentMeans": [
    "ram:TypeCode", "ram:PayerPartyDebtorFinancialAccount",
    "ram:PayeePartyCreditorFinancialAccount",
  ],
  // TradeTaxType (header et ligne)
  "ram:ApplicableTradeTax": [
    "ram:CalculatedAmount", "ram:TypeCode", "ram:ExemptionReason",
    "ram:BasisAmount", "ram:CategoryCode", "ram:ExemptionReasonCode",
    "ram:DueDateTypeCode", "ram:RateApplicablePercent",
  ],
  // TradeAllowanceChargeType (header et ligne)
  "ram:SpecifiedTradeAllowanceCharge": [
    "ram:ChargeIndicator", "ram:CalculationPercent", "ram:BasisAmount",
    "ram:ActualAmount", "ram:ReasonCode", "ram:Reason", "ram:CategoryTradeTax",
  ],
  // CategoryTradeTax dans TradeAllowanceCharge (même TradeTaxType)
  "ram:CategoryTradeTax": [
    "ram:CalculatedAmount", "ram:TypeCode", "ram:ExemptionReason",
    "ram:BasisAmount", "ram:CategoryCode", "ram:ExemptionReasonCode",
    "ram:DueDateTypeCode", "ram:RateApplicablePercent",
  ],
  // TradePaymentTermsType
  "ram:SpecifiedTradePaymentTerms": [
    "ram:Description", "ram:DueDateDateTime", "ram:DirectDebitMandateID",
  ],
  // TradeSettlementHeaderMonetarySummationType
  "ram:SpecifiedTradeSettlementHeaderMonetarySummation": [
    "ram:LineTotalAmount", "ram:ChargeTotalAmount", "ram:AllowanceTotalAmount",
    "ram:TaxBasisTotalAmount", "ram:TaxTotalAmount",
    "ram:GrandTotalAmount", "ram:TotalPrepaidAmount", "ram:DuePayableAmount",
  ],
  // SupplyChainTradeLineItemType
  "ram:IncludedSupplyChainTradeLineItem": [
    "ram:AssociatedDocumentLineDocument", "ram:SpecifiedTradeProduct",
    "ram:SpecifiedLineTradeAgreement", "ram:SpecifiedLineTradeDelivery",
    "ram:SpecifiedLineTradeSettlement",
  ],
  // TradeProductType
  "ram:SpecifiedTradeProduct": [
    "ram:GlobalID", "ram:Name",
  ],
  // LineTradeAgreementType
  "ram:SpecifiedLineTradeAgreement": [
    "ram:GrossPriceProductTradePrice", "ram:NetPriceProductTradePrice",
  ],
  // TradePriceType (brut et net)
  "ram:GrossPriceProductTradePrice": [
    "ram:ChargeAmount", "ram:BasisQuantity", "ram:AppliedTradeAllowanceCharge",
  ],
  "ram:NetPriceProductTradePrice": [
    "ram:ChargeAmount", "ram:BasisQuantity",
  ],
  // LineTradeSettlementType
  "ram:SpecifiedLineTradeSettlement": [
    "ram:ApplicableTradeTax", "ram:BillingSpecifiedPeriod",
    "ram:SpecifiedTradeAllowanceCharge",
    "ram:SpecifiedTradeSettlementLineMonetarySummation",
  ],
}

// Type pour les éléments parsés par fast-xml-parser en mode preserveOrder
type XmlElement = Record<string, unknown> & { ":@"?: Record<string, string> }

// Identifiants PDP pour injection dans le XML (GlobalID + adresse électronique)
interface PdpIdentifiers {
  sellerSiret?: string
  buyerSiret?: string
}

/**
 * Réordonne récursivement les éléments XML enfants selon l'ordre CII.
 * Utilise fast-xml-parser en mode preserveOrder pour manipuler la structure.
 */
function reorderCiiXml(xml: string, identifiers?: PdpIdentifiers): string {
  const parser = new XMLParser({
    ignoreAttributes: false,
    preserveOrder: true,
    commentPropName: "#comment",
    processEntities: true,
    trimValues: false,
    // Désactiver le parsing des valeurs numériques pour préserver les zéros en tête
    // (ex: SIRET "000000002" ne doit PAS être converti en nombre 2)
    numberParseOptions: {
      leadingZeros: false,
      hex: false,
      eNotation: false,
    },
  })
  const parsed = parser.parse(xml)

  // Injecter ApplicableHeaderTradeDelivery si absent (obligatoire dans le XSD)
  injectMissingDelivery(parsed)

  // Injecter GlobalID + URIUniversalCommunication si absents (obligatoire pour transmission PDP)
  if (identifiers) {
    injectPdpIdentifiers(parsed, identifiers)
  }

  // Réordonner récursivement (après injection pour que le nouvel élément soit trié)
  reorderElements(parsed)

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    preserveOrder: true,
    commentPropName: "#comment",
    processEntities: true,
    format: true,
    indentBy: "  ",
    suppressEmptyNode: false,
  })
  const reordered = builder.build(parsed)

  // Ajouter la déclaration XML si absente
  if (!reordered.startsWith("<?xml")) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n${reordered}`
  }
  return reordered
}

/**
 * Injecte un élément ApplicableHeaderTradeDelivery vide s'il est absent.
 * Le XSD CII l'exige même si aucune date de livraison n'est renseignée.
 */
function injectMissingDelivery(elements: XmlElement[]): void {
  for (const element of elements) {
    for (const key of Object.keys(element)) {
      if (key === ":@" || key === "#text") continue
      const children = element[key]
      if (!Array.isArray(children)) continue

      // Chercher dans SupplyChainTradeTransaction
      if (key === "rsm:SupplyChainTradeTransaction") {
        const hasDelivery = (children as XmlElement[]).some(
          (c) => "ram:ApplicableHeaderTradeDelivery" in c
        )
        if (!hasDelivery) {
          // Injecter un élément vide
          ;(children as XmlElement[]).push({
            "ram:ApplicableHeaderTradeDelivery": [],
          })
        }
      }

      // Descendre récursivement
      injectMissingDelivery(children as XmlElement[])
    }
  }
}

/**
 * Injecte GlobalID et URIUniversalCommunication dans les TradeParty.
 * - GlobalID (schemeID="0225") : identifiant SIRET, utilisé par le PDP pour identifier le vendeur/acheteur
 * - URIUniversalCommunication (schemeID="0225") : adresse électronique obligatoire pour transmission PDP
 * Scheme 0225 = SIRET en France (norme PEPPOL / ISO 6523)
 */
function injectPdpIdentifiers(elements: XmlElement[], identifiers: PdpIdentifiers): void {
  for (const element of elements) {
    for (const key of Object.keys(element)) {
      if (key === ":@" || key === "#text") continue
      const children = element[key]
      if (!Array.isArray(children)) continue

      // Injecter dans SellerTradeParty
      if (key === "ram:SellerTradeParty" && identifiers.sellerSiret) {
        injectPartyIdentifiers(children as XmlElement[], identifiers.sellerSiret)
      }

      // Injecter dans BuyerTradeParty
      if (key === "ram:BuyerTradeParty" && identifiers.buyerSiret) {
        injectPartyIdentifiers(children as XmlElement[], identifiers.buyerSiret)
      }

      // Descendre récursivement
      injectPdpIdentifiers(children as XmlElement[], identifiers)
    }
  }
}

/**
 * Injecte GlobalID et URIUniversalCommunication dans un TradeParty donné.
 */
function injectPartyIdentifiers(children: XmlElement[], siret: string): void {
  // Injecter GlobalID (schemeID="0225") si absent
  const hasGlobalId = children.some((c) => "ram:GlobalID" in c)
  if (!hasGlobalId) {
    children.push({
      "ram:GlobalID": [{ "#text": siret }],
      ":@": { "@_schemeID": "0225" },
    })
  }

  // Injecter URIUniversalCommunication (schemeID="0225") si absent
  const hasUri = children.some((c) => "ram:URIUniversalCommunication" in c)
  if (!hasUri) {
    children.push({
      "ram:URIUniversalCommunication": [{
        "ram:URIID": [{ "#text": siret }],
        ":@": { "@_schemeID": "0225" },
      }],
    })
  }
}

/**
 * Réordonne les enfants d'un tableau d'éléments selon CII_ELEMENT_ORDER.
 */
function reorderElements(elements: XmlElement[]): void {
  for (const element of elements) {
    for (const key of Object.keys(element)) {
      if (key === ":@" || key === "#text") continue

      const children = element[key]
      if (!Array.isArray(children)) continue

      // Réordonner les enfants si un ordre est défini pour ce parent
      const order = CII_ELEMENT_ORDER[key]
      if (order) {
        element[key] = sortByOrder(children as XmlElement[], order)
      }

      // Descendre récursivement
      reorderElements(children as XmlElement[])
    }
  }
}

/**
 * Trie un tableau d'éléments XML selon un ordre de noms prédéfini.
 * Les éléments non listés sont placés à la fin dans leur ordre d'origine.
 */
function sortByOrder(elements: XmlElement[], order: string[]): XmlElement[] {
  return [...elements].sort((a, b) => {
    const nameA = Object.keys(a).find((k) => k !== ":@" && k !== "#text") ?? ""
    const nameB = Object.keys(b).find((k) => k !== ":@" && k !== "#text") ?? ""
    const indexA = order.indexOf(nameA)
    const indexB = order.indexOf(nameB)
    // Éléments non listés → à la fin (index = order.length)
    const posA = indexA === -1 ? order.length : indexA
    const posB = indexB === -1 ? order.length : indexB
    return posA - posB
  })
}

// ============================================
// CONSTRUCTION DES DONNÉES FACTUR-X
// ============================================

/**
 * Transforme une facture Prisma en structure de données node-zugferd (profil BASIC).
 * Gère : franchise TVA, multi-taux, remise globale, remise par ligne.
 */
function buildFacturXData(invoice: InvoiceWithRelations, company: Company) {
  const isFranchise = company.vatRegime === "FRANCHISE"
  const globalDiscountPercent = toNum(invoice.discountPercent)

  // --- Calcul des totaux par groupe de TVA ---
  // Somme des totalHt de chaque ligne (après remise ligne, avant remise globale)
  const lineItems = invoice.items.map((item) => ({
    ...item,
    qty: toNum(item.quantity),
    unitPrice: toNum(item.unitPriceHt),
    vatRate: toNum(item.vatRate),
    lineDiscount: toNum(item.discountPercent),
    lineTotalHt: toNum(item.totalHt),
  }))

  // Sous-total HT = somme des lignes (avant remise globale)
  const subtotalHt = lineItems.reduce((sum, item) => sum + item.lineTotalHt, 0)

  // Montant de la remise globale
  const globalDiscountAmount = round2(subtotalHt * (globalDiscountPercent / 100))

  // Regroupement par taux de TVA pour le vatBreakdown
  const taxGroups = new Map<number, { baseHt: number }>()
  for (const item of lineItems) {
    const rate = isFranchise ? 0 : item.vatRate
    const current = taxGroups.get(rate) ?? { baseHt: 0 }
    current.baseHt += item.lineTotalHt
    taxGroups.set(rate, current)
  }

  // --- Seller (entreprise) ---
  const seller: Record<string, unknown> = {
    name: company.name,
    postalAddress: {
      countryCode: SELLER_COUNTRY,
      ...(company.zipCode && { postCode: company.zipCode }),
      ...(company.address && { line1: company.address }),
      ...(company.city && { city: company.city }),
    },
  }
  // SIRET et TVA intracommunautaire
  if (company.siret || company.vatNumber) {
    seller.taxRegistration = {
      ...(company.vatNumber && { vatIdentifier: company.vatNumber }),
      ...(company.siret && { localIdentifier: company.siret }),
    }
  }
  if (company.siret) {
    // Identifiant global SIRET (scheme 0225 = SIRET, norme PEPPOL / ISO 6523)
    // Utilisé par le PDP pour identifier le vendeur
    seller.globalIdentifier = {
      value: company.siret,
      schemeIdentifier: "0225",
    }
    seller.organization = {
      registrationIdentifier: {
        value: company.siret,
        schemeIdentifier: "0002", // 0002 = SIRET en France
      },
    }
    // Adresse électronique (obligatoire pour la transmission PDP)
    // Scheme 0225 = SIRET en France (norme PEPPOL / ISO 6523)
    seller.electronicAddress = {
      value: company.siret,
      schemeIdentifier: "0225",
    }
  }

  // --- Buyer (client) ---
  const buyer: Record<string, unknown> = {
    name: invoice.client.name,
  }
  if (invoice.client.address || invoice.client.city || invoice.client.zipCode) {
    buyer.postalAddress = {
      countryCode: SELLER_COUNTRY, // Clients France par défaut
      ...(invoice.client.zipCode && { postCode: invoice.client.zipCode }),
      ...(invoice.client.address && { line1: invoice.client.address }),
      ...(invoice.client.city && { city: invoice.client.city }),
    }
  }
  if (invoice.client.siret) {
    // Identifiant global SIRET acheteur (scheme 0225)
    buyer.globalIdentifier = {
      value: invoice.client.siret,
      schemeIdentifier: "0225",
    }
    buyer.organization = {
      registrationIdentifier: {
        value: invoice.client.siret,
        schemeIdentifier: "0002",
      },
    }
    // Adresse électronique acheteur (SIRET, scheme 0225)
    buyer.electronicAddress = {
      value: invoice.client.siret,
      schemeIdentifier: "0225",
    }
  }

  // --- VAT Breakdown ---
  // Un groupe par taux de TVA, avec répartition proportionnelle de la remise globale
  const vatBreakdown = Array.from(taxGroups.entries()).map(([rate, group]) => {
    // Répartition proportionnelle de la remise globale sur ce groupe
    const groupDiscount = subtotalHt > 0
      ? round2(globalDiscountAmount * (group.baseHt / subtotalHt))
      : 0
    const adjustedBase = round2(group.baseHt - groupDiscount)
    const vatAmount = isFranchise ? 0 : round2(adjustedBase * (rate / 100))

    return {
      calculatedAmount: vatAmount,
      typeCode: "VAT" as const,
      basisAmount: adjustedBase,
      categoryCode: isFranchise ? ("E" as const) : ("S" as const),
      rateApplicablePercent: rate,
      ...(isFranchise && { exemptionReasonText: FRANCHISE_TAX_REASON }),
    }
  })

  // --- Allowances (remise globale) ---
  // Si remise globale > 0, créer une allowance par groupe de TVA
  const allowances = globalDiscountAmount > 0
    ? Array.from(taxGroups.entries()).map(([rate, group]) => {
      const groupDiscount = subtotalHt > 0
        ? round2(globalDiscountAmount * (group.baseHt / subtotalHt))
        : 0
      return {
        actualAmount: groupDiscount,
        calculationPercent: globalDiscountPercent,
        basisAmount: round2(group.baseHt),
        reasonCode: "95" as const, // 95 = Discount
        reason: `Remise globale ${globalDiscountPercent}%`,
        categoryTradeTax: {
          categoryCode: isFranchise ? ("E" as const) : ("S" as const),
          vatRate: rate,
        },
      }
    })
    : undefined

  // --- Payment instruction ---
  const paymentInstruction = {
    typeCode: toPaymentCode(invoice.paymentMethod),
  }

  // --- Lines ---
  const lines = lineItems.map((item, index) => {
    const hasLineDiscount = item.lineDiscount > 0
    const netUnitPrice = round2(item.unitPrice * (1 - item.lineDiscount / 100))
    const unitCode = toUnitCode(item.unit)

    return {
      identifier: String(index + 1),
      tradeProduct: {
        name: item.description,
      },
      tradeAgreement: {
        // Prix brut + remise ligne (si applicable)
        ...(hasLineDiscount && {
          grossTradePrice: {
            chargeAmount: item.unitPrice,
            basisQuantity: { amount: 1, unitMeasureCode: unitCode },
            discounts: {
              actualAmount: round2(item.unitPrice * item.lineDiscount / 100),
            },
          },
        }),
        // Prix net unitaire (après remise ligne)
        netTradePrice: {
          chargeAmount: netUnitPrice,
          basisQuantity: { amount: 1, unitMeasureCode: unitCode },
        },
      },
      tradeDelivery: {
        billedQuantity: {
          amount: item.qty,
          unitMeasureCode: unitCode,
        },
      },
      tradeSettlement: {
        tradeTax: {
          typeCode: "VAT" as const,
          categoryCode: isFranchise ? ("E" as const) : ("S" as const),
          rateApplicablePercent: isFranchise ? 0 : item.vatRate,
        },
        monetarySummation: {
          lineTotalAmount: item.lineTotalHt,
        },
      },
    }
  })

  // --- Monetary summation ---
  const totalHt = toNum(invoice.totalHt)
  const totalVat = toNum(invoice.totalVat)
  const totalTtc = toNum(invoice.totalTtc)

  // Assemblage final de la structure node-zugferd
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {
    number: invoice.number,
    typeCode: "380" as const, // Facture commerciale
    issueDate: new Date(invoice.date),
    transaction: {
      tradeAgreement: {
        seller,
        buyer,
      },
      tradeDelivery: {},
      tradeSettlement: {
        currencyCode: "EUR",
        vatBreakdown,
        paymentInstruction,
        paymentTerms: {
          dueDate: new Date(invoice.dueDate),
        },
        ...(allowances && { allowances }),
        monetarySummation: {
          lineTotalAmount: round2(subtotalHt),
          ...(globalDiscountAmount > 0 && { allowanceTotalAmount: globalDiscountAmount }),
          taxBasisTotalAmount: totalHt,
          taxTotal: {
            amount: totalVat,
            currencyCode: "EUR",
          },
          grandTotalAmount: totalTtc,
          duePayableAmount: totalTtc,
        },
      },
      line: lines,
    },
  }

  return data
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

/**
 * Génère le XML Factur-X CII et l'embarque dans le PDF donné.
 * Retourne le XML et le buffer PDF/A-3b avec XML embarqué.
 */
export async function generateFacturX(
  invoice: InvoiceWithRelations,
  company: Company,
  pdfBuffer: Uint8Array | Buffer
): Promise<FacturXResult> {
  // Construire la structure de données Factur-X
  const data = buildFacturXData(invoice, company)

  // Créer l'objet facture node-zugferd
  const facturxInvoice = await invoicer.create(data)

  // Générer le XML CII et réordonner les éléments (correctif node-zugferd v0.0.3)
  // Injection des adresses électroniques (SIRET, obligatoire pour transmission PDP)
  const rawXml = facturxInvoice.toXML()
  const xml = reorderCiiXml(rawXml, {
    sellerSiret: company.siret ?? undefined,
    buyerSiret: invoice.client.siret ?? undefined,
  })

  // Monkey-patch toXML pour que embedInPdf utilise le XML réordonné
  // (embedInPdf appelle toXML() en interne — vérifié ligne 587 du source)
  facturxInvoice.toXML = () => xml

  // Embarquer le XML réordonné dans le PDF et convertir en PDF/A-3b
  const pdfA = await facturxInvoice.embedInPdf(pdfBuffer, {
    metadata: {
      title: `Facture ${invoice.number}`,
      author: company.name,
    },
  })

  return { xml, pdfBuffer: pdfA }
}
