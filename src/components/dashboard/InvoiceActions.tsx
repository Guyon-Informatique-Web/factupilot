"use client"

// Actions rapides sur une facture (envoyer, marquer payée, annuler, supprimer)
import { useState } from "react"
import { updateInvoiceStatus, deleteInvoice, duplicateInvoice } from "@/app/dashboard/invoices/actions"
import { sendInvoiceByEmail } from "@/app/dashboard/invoices/email-actions"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Send, CreditCard, XCircle, Trash2, MoreHorizontal, Loader2, ArrowLeft, Download, Mail, Copy, Pencil } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface InvoiceActionsProps {
  invoiceId: string
  status: string
  hasClientEmail?: boolean
}

export function InvoiceActions({ invoiceId, status, hasClientEmail }: InvoiceActionsProps) {
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
      <Link href="/dashboard/invoices">
        <Button variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </Link>

      <a href={`/api/invoices/${invoiceId}/pdf`} target="_blank" rel="noopener noreferrer">
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
              <DropdownMenuItem onClick={() => handleAction(() => sendInvoiceByEmail(invoiceId), "Facture envoyée par email")}>
                <Mail className="mr-2 h-4 w-4" />
                Envoyer par email
              </DropdownMenuItem>
            )}
            {status === "DRAFT" && (
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/invoices/${invoiceId}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier la facture
                </Link>
              </DropdownMenuItem>
            )}
            {status === "DRAFT" && (
              <DropdownMenuItem onClick={() => handleAction(() => updateInvoiceStatus(invoiceId, "SENT"), "Facture marquée comme envoyée")}>
                <Send className="mr-2 h-4 w-4" />
                Marquer comme envoyée
              </DropdownMenuItem>
            )}
            {(status === "SENT" || status === "OVERDUE") && (
              <DropdownMenuItem onClick={() => handleAction(() => updateInvoiceStatus(invoiceId, "PAID"), "Facture marquée comme payée")}>
                <CreditCard className="mr-2 h-4 w-4" />
                Marquer comme payée
              </DropdownMenuItem>
            )}
            {(status === "DRAFT" || status === "SENT") && (
              <DropdownMenuItem onClick={() => handleAction(() => updateInvoiceStatus(invoiceId, "CANCELLED"), "Facture annulée")}>
                <XCircle className="mr-2 h-4 w-4" />
                Annuler la facture
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleAction(() => duplicateInvoice(invoiceId), "Facture dupliquée")}>
              <Copy className="mr-2 h-4 w-4" />
              Dupliquer
            </DropdownMenuItem>
            {status === "DRAFT" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleAction(() => deleteInvoice(invoiceId), "Brouillon supprimé")}
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
