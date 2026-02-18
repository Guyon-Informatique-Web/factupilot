// Client Resend (singleton lazy via Proxy)
import { Resend } from "resend"

export const resend = new Proxy({} as Resend, {
  get(_, prop) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("La variable d'environnement RESEND_API_KEY est requise")
    }
    const client = new Resend(process.env.RESEND_API_KEY)
    return (client as unknown as Record<string | symbol, unknown>)[prop]
  },
})
