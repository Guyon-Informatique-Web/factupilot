// Page de mot de passe oublié
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm"

export const metadata = {
  title: "Mot de passe oublié",
  description: "Réinitialisez votre mot de passe FactuPilot",
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
