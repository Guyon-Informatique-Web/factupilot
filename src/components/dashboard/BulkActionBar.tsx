"use client"

// Barre d'actions groupées affichée quand des éléments sont sélectionnés
import { Button } from "@/components/ui/button"
import { X, Loader2 } from "lucide-react"

interface BulkAction {
  label: string
  icon: React.ReactNode
  onClick: () => void
  variant?: "default" | "destructive" | "outline"
  loading?: boolean
}

interface BulkActionBarProps {
  count: number
  actions: BulkAction[]
  onCancel: () => void
}

export function BulkActionBar({ count, actions, onCancel }: BulkActionBarProps) {
  if (count === 0) return null

  const isAnyLoading = actions.some((a) => a.loading)

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3 shadow-lg">
        <span className="text-sm font-medium">
          {count} élément{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}
        </span>
        <div className="h-4 w-px bg-border" />
        {actions.map((action) => (
          <Button
            key={action.label}
            size="sm"
            variant={action.variant ?? "default"}
            onClick={action.onClick}
            disabled={isAnyLoading}
          >
            {action.loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <span className="mr-2">{action.icon}</span>
            )}
            {action.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isAnyLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
