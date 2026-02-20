// Route pour recevoir les erreurs du frontend (global-error.tsx)
// Rate-limited : 10 requetes par minute par IP

import { NextRequest, NextResponse } from "next/server"
import { logError } from "@/lib/error-logger"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)

  const { success } = rateLimit(`error-report:${ip}`, {
    maxRequests: 10,
    windowSeconds: 60,
  })

  if (!success) {
    return NextResponse.json({ error: "Trop de requetes" }, { status: 429 })
  }

  try {
    const body = await request.json()
    const message = typeof body.message === "string" ? body.message : "Erreur client inconnue"
    const trace = typeof body.trace === "string" ? body.trace : undefined

    await logError("ERROR", "SYSTEM", message, {
      trace,
      requestIp: ip,
      file: "global-error.tsx",
    })

    return NextResponse.json({ logged: true })
  } catch {
    return NextResponse.json({ error: "Donnees invalides" }, { status: 400 })
  }
}
