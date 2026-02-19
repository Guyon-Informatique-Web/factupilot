// Client PDP (Plateforme de Dématérialisation Partenaire)
// Gère l'authentification OAuth2 et la soumission de factures Factur-X
// Fournisseur principal : Super PDP (https://superpdp.tech)

import { prisma } from "@/lib/prisma"

// ============================================
// TYPES
// ============================================

// Résultat de la soumission d'une facture au PDP
export interface PdpSubmitResult {
  provider: "superpdp"
  invoiceId: string
  status: string
}

// Événement PDP sur une facture
interface PdpEvent {
  id: number
  created_at: string
  invoice_id: number
  status_code: string
  status_text: string
}

// Réponse API Super PDP pour une facture
interface SuperPdpInvoiceResponse {
  id: number
  company_id: number
  created_at: string
  direction: string
  events: PdpEvent[]
}

// ============================================
// CACHE TOKEN OAUTH2 (en mémoire, rafraîchi automatiquement)
// ============================================

interface CachedToken {
  accessToken: string
  expiresAt: number // timestamp ms
}

let tokenCache: CachedToken | null = null

/**
 * Obtient un token OAuth2 Super PDP (client_credentials).
 * Utilise un cache en mémoire et rafraîchit automatiquement 60s avant expiration.
 */
async function getSuperPdpToken(): Promise<string> {
  // Vérifier le cache (avec marge de 60s)
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.accessToken
  }

  const apiUrl = process.env.SUPERPDP_API_URL
  const clientId = process.env.SUPERPDP_CLIENT_ID
  const clientSecret = process.env.SUPERPDP_CLIENT_SECRET

  if (!apiUrl || !clientId || !clientSecret) {
    throw new Error("[PDP] Variables SUPERPDP_API_URL, SUPERPDP_CLIENT_ID ou SUPERPDP_CLIENT_SECRET manquantes")
  }

  const res = await fetch(`${apiUrl}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`[PDP] Authentification Super PDP échouée : ${res.status} — ${body.slice(0, 300)}`)
  }

  const data = await res.json()
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  }

  return data.access_token
}

// ============================================
// SOUMISSION DE FACTURE
// ============================================

/**
 * Soumet une facture Factur-X (XML CII) au PDP Super PDP.
 * Retourne l'ID et le statut de la facture sur le PDP.
 */
export async function submitToPdp(xml: string): Promise<PdpSubmitResult> {
  const token = await getSuperPdpToken()
  const apiUrl = process.env.SUPERPDP_API_URL!

  const res = await fetch(`${apiUrl}/v1.beta/invoices`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/xml",
    },
    body: xml,
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`[PDP] Soumission échouée : ${res.status} — ${body.slice(0, 500)}`)
  }

  const data: SuperPdpInvoiceResponse = await res.json()
  const lastEvent = data.events[data.events.length - 1]

  return {
    provider: "superpdp",
    invoiceId: String(data.id),
    status: lastEvent?.status_code ?? "uploaded",
  }
}

// ============================================
// VÉRIFICATION DE STATUT
// ============================================

/**
 * Vérifie le statut d'une facture sur le PDP Super PDP.
 * Retourne le dernier statut et les événements.
 */
export async function getPdpStatus(pdpInvoiceId: string): Promise<{
  status: string
  statusText: string
  events: PdpEvent[]
}> {
  const token = await getSuperPdpToken()
  const apiUrl = process.env.SUPERPDP_API_URL!

  const res = await fetch(`${apiUrl}/v1.beta/invoices/${pdpInvoiceId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`[PDP] Vérification statut échouée : ${res.status} — ${body.slice(0, 300)}`)
  }

  const data: SuperPdpInvoiceResponse = await res.json()
  const lastEvent = data.events[data.events.length - 1]

  return {
    status: lastEvent?.status_code ?? "unknown",
    statusText: lastEvent?.status_text ?? "Inconnu",
    events: data.events,
  }
}

// ============================================
// SOUMISSION AVEC PERSISTANCE BDD
// ============================================

/**
 * Soumet une facture au PDP et enregistre le résultat en BDD.
 * Utilisé par email-actions et pdp-actions.
 */
export async function submitInvoiceToPdp(invoiceId: string, xml: string): Promise<PdpSubmitResult> {
  try {
    const result = await submitToPdp(xml)

    // Enregistrer le résultat en BDD
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        pdpProvider: result.provider,
        pdpInvoiceId: result.invoiceId,
        pdpStatus: result.status,
        pdpSubmittedAt: new Date(),
        pdpError: null,
      },
    })

    return result
  } catch (err) {
    // Enregistrer l'erreur en BDD
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        pdpProvider: "superpdp",
        pdpStatus: "error",
        pdpError: String(err),
        pdpSubmittedAt: new Date(),
      },
    }).catch((dbErr) => console.error("[PDP] Erreur stockage statut :", dbErr))

    throw err
  }
}

/**
 * Rafraîchit le statut PDP d'une facture depuis le PDP et met à jour la BDD.
 */
export async function refreshPdpStatus(invoiceId: string): Promise<string> {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    select: { pdpInvoiceId: true, pdpProvider: true },
  })

  if (!invoice.pdpInvoiceId) {
    throw new Error("Cette facture n'a pas été soumise au PDP")
  }

  const { status, statusText } = await getPdpStatus(invoice.pdpInvoiceId)

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      pdpStatus: status,
      pdpError: null,
    },
  })

  return statusText
}
