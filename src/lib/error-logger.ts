// Service de logging d'erreurs systeme — version sans BDD
// Envoi email si ERROR/CRITICAL
// Throttle : 1h entre emails identiques (sauf CRITICAL)

import { sendErrorAlertEmail } from "@/lib/error-email"

// Types simples (pas de Prisma enum car pas de table ErrorLog)
export type ErrorLevel = "ERROR" | "CRITICAL"
export type ErrorCategory = "SYSTEM" | "API" | "AUTH" | "PAYMENT" | "WEBHOOK"

// Throttle en memoire : cle = hash, valeur = timestamp dernier envoi
const emailThrottle = new Map<string, number>()
const THROTTLE_WINDOW = 60 * 60 * 1000 // 1 heure

// Nettoyage periodique
let lastThrottleCleanup = Date.now()
const THROTTLE_CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 min

function cleanupThrottle() {
  const now = Date.now()
  if (now - lastThrottleCleanup < THROTTLE_CLEANUP_INTERVAL) return
  lastThrottleCleanup = now
  for (const [key, timestamp] of emailThrottle) {
    if (now - timestamp > THROTTLE_WINDOW) {
      emailThrottle.delete(key)
    }
  }
}

// Generer une cle de throttle simple
function getThrottleKey(category: string, message: string): string {
  return `${category}:${message.slice(0, 100)}`
}

interface ErrorContext {
  file?: string
  line?: number
  trace?: string
  requestMethod?: string
  requestUri?: string
  requestIp?: string
  userId?: string
  [key: string]: unknown
}

export async function logError(
  level: ErrorLevel,
  category: ErrorCategory,
  message: string,
  context?: ErrorContext
): Promise<void> {
  try {
    // Log console en fallback systématique
    console.error(`[${level}] [${category}] ${message}`)

    // Envoyer email
    cleanupThrottle()

    const throttleKey = getThrottleKey(category, message)
    const lastSent = emailThrottle.get(throttleKey)
    const now = Date.now()

    // CRITICAL bypass le throttle
    const shouldSend =
      level === "CRITICAL" || !lastSent || now - lastSent > THROTTLE_WINDOW

    if (shouldSend) {
      emailThrottle.set(throttleKey, now)

      // Envoi async sans bloquer
      sendErrorAlertEmail({
        level,
        category,
        message,
        file: context?.file,
        line: context?.line,
        requestMethod: context?.requestMethod,
        requestUri: context?.requestUri,
        requestIp: context?.requestIp,
        trace: context?.trace,
      }).catch((err) => {
        console.error("Echec envoi email erreur:", err)
      })
    }
  } catch (error) {
    // Ne jamais crash l'appelant
    console.error(
      "ErrorLogger - echec logging:",
      error instanceof Error ? error.message : error
    )
  }
}

// Raccourcis par categorie
export function logSystemError(message: string, context?: ErrorContext) {
  return logError("ERROR", "SYSTEM", message, context)
}

export function logApiError(message: string, context?: ErrorContext) {
  return logError("ERROR", "API", message, context)
}

export function logPaymentError(message: string, context?: ErrorContext) {
  return logError("ERROR", "PAYMENT", message, context)
}

export function logWebhookError(message: string, context?: ErrorContext) {
  return logError("ERROR", "WEBHOOK", message, context)
}
