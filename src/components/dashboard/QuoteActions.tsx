"use client"

// Actions rapides sur un devis (envoyer, accepter, refuser, supprimer)
import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateQuoteStatus, deleteQuote, duplicateQuote } from "@/app/dashboard/quotes/actions"
import { createInvoiceFromQuote } from "@/app/dashboard/invoices/actions"
import { sendQuoteByEmail } from "@/app/dashboard/quotes/email-actions"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Send, Check, X, Trash2, MoreHorizontal, Loader2, ArrowLeft, FileText, Download, Mail, Pencil, Copy } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface QuoteActionsProps {
  quoteId: string
  status: string
  hasClientEmail?: boolean
}

export function QuoteActions({ quoteId, status, hasClientEmail }: QuoteActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleAction = async (action: () => Promise<void>, successMessage?: string) => {
    setLoading(true)
    try {
      await action()
      if (successMessage) toast.success(successMessage)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue")
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/dashboard/quotes">
        <Button variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </Link>

      <a href={`/api/quotes/${quoteId}/pdf`} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          PDF
        </Button>
      </a>

      {loading ? (
        <Button disabled size="sm">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          En cours...
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="mr-2 h-4 w-4" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {hasClientEmail && (
              <DropdownMenuItem onClick={() => handleAction(() => sendQuoteByEmail(quoteId), "Devis envoyé par email")}>
                <Mail className="mr-2 h-4 w-4" />
                Envoyer par email
              </DropdownMenuItem>
            )}
            {status === "DRAFT" && (
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/quotes/${quoteId}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier le devis
                </Link>
              </DropdownMenuItem>
            )}
            {status === "DRAFT" && (
              <DropdownMenuItem onClick={() => handleAction(() => updateQuoteStatus(quoteId, "SENT"), "Devis marqué comme envoyé")}>
                <Send className="mr-2 h-4 w-4" />
                Marquer comme envoyé
              </DropdownMenuItem>
            )}
            {status === "SENT" && (
              <>
                <DropdownMenuItem onClick={() => handleAction(() => updateQuoteStatus(quoteId, "ACCEPTED"), "Devis marqué comme accepté")}>
                  <Check className="mr-2 h-4 w-4" />
                  Marquer comme accepté
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction(() => updateQuoteStatus(quoteId, "REFUSED"), "Devis marqué comme refusé")}>
                  <X className="mr-2 h-4 w-4" />
                  Marquer comme refusé
                </DropdownMenuItem>
              </>
            )}
            {status === "ACCEPTED" && (
              <DropdownMenuItem onClick={() => handleAction(() => createInvoiceFromQuote(quoteId), "Facture créée depuis le devis")}>
                <FileText className="mr-2 h-4 w-4" />
                Convertir en facture
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleAction(() => duplicateQuote(quoteId), "Devis dupliqué")}>
              <Copy className="mr-2 h-4 w-4" />
              Dupliquer
            </DropdownMenuItem>
            {status === "DRAFT" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleAction(() => deleteQuote(quoteId), "Brouillon supprimé")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer le brouillon
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
