// Envoi d'emails d'alerte erreur systeme via Resend
// Destinataire : ADMIN_EMAIL (env var)

import { resend } from "@/lib/resend"
import { APP_CONFIG } from "@/config/app"
import { ErrorAlertEmail } from "@/components/emails/ErrorAlertEmail"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

interface ErrorEmailData {
  level: string
  category: string
  message: string
  file?: string | null
  line?: number | null
  requestMethod?: string | null
  requestUri?: string | null
  requestIp?: string | null
  trace?: string | null
}

export async function sendErrorAlertEmail(data: ErrorEmailData): Promise<boolean> {
  if (!ADMIN_EMAIL) {
    console.error("ADMIN_EMAIL non defini, envoi d'alerte ignore")
    return false
  }

  try {
    const timestamp = new Date().toLocaleString("fr-FR", {
      timeZone: "Europe/Paris",
    })
    const environment =
      process.env.NODE_ENV === "production" ? "production" : "developpement"

    // Sujet court : max 60 chars du message
    const shortMessage =
      data.message.length > 60
        ? data.message.slice(0, 57) + "..."
        : data.message

    const { error } = await resend.emails.send({
      from: `${APP_CONFIG.name} <${APP_CONFIG.email.from}>`,
      to: ADMIN_EMAIL,
      subject: `[ALERTE ${APP_CONFIG.name}] ${data.level}: ${shortMessage}`,
      react: ErrorAlertEmail({
        level: data.level,
        category: data.category,
        message: data.message,
        file: data.file,
        line: data.line,
        requestMethod: data.requestMethod,
        requestUri: data.requestUri,
        requestIp: data.requestIp,
        trace: data.trace,
        environment,
        timestamp,
      }),
    })

    if (error) {
      console.error("Erreur envoi email erreur:", error)
      return false
    }

    return true
  } catch (error) {
    console.error(
      "Erreur Resend (error alert):",
      error instanceof Error ? error.message : error
    )
    return false
  }
}
