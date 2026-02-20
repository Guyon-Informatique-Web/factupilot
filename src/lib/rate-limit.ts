// Rate limiting en memoire pour les API routes
// Utilise un Map avec nettoyage automatique des entrees expirees

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Nettoyage periodique des entrees expirees (toutes les 60s)
let lastCleanup = Date.now()
const CLEANUP_INTERVAL = 60_000

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}

interface RateLimitOptions {
  // Nombre max de requetes dans la fenetre
  maxRequests: number
  // Duree de la fenetre en secondes
  windowSeconds: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  cleanup()

  const now = Date.now()
  const windowMs = options.windowSeconds * 1000
  const entry = store.get(key)

  // Premiere requete ou fenetre expiree
  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { success: true, remaining: options.maxRequests - 1, resetAt }
  }

  // Fenetre en cours
  if (entry.count >= options.maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return {
    success: true,
    remaining: options.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

// Extraire l'IP depuis les headers (Next.js / Vercel)
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  )
}
