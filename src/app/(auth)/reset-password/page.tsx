// Page de réinitialisation du mot de passe (après clic sur le lien email)
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"

export const metadata = {
  title: "Nouveau mot de passe",
  description: "Choisissez un nouveau mot de passe pour votre compte FactuPilot",
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}
