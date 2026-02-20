"use client"

// Liste des utilisateurs pour l'admin
import { useState } from "react"
import { adminUpdateUserPlan, adminToggleAdmin, adminDeleteUser } from "@/app/dashboard/admin/actions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { MoreHorizontal, Shield, ShieldOff, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog"

type Plan = "FREE" | "STARTER" | "PRO" | "BUSINESS"

interface AdminUser {
  id: string
  email: string
  name: string | null
  plan: Plan
  isAdmin: boolean
  companyName: string | null
  createdAt: Date
}

interface AdminUserListProps {
  users: AdminUser[]
}

const PLAN_LABELS: Record<Plan, string> = {
  FREE: "Gratuit",
  STARTER: "Starter",
  PRO: "Pro",
  BUSINESS: "Business",
}

const PLAN_VARIANTS: Record<Plan, "secondary" | "default" | "destructive" | "outline"> = {
  FREE: "secondary",
  STARTER: "outline",
  PRO: "default",
  BUSINESS: "default",
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR").format(new Date(date))

export function AdminUserList({ users }: AdminUserListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    confirmLabel: string
    variant: "default" | "destructive"
    onConfirm: () => Promise<void>
  }>({ open: false, title: "", description: "", confirmLabel: "", variant: "default", onConfirm: async () => {} })

  const handlePlanChange = async (userId: string, plan: Plan) => {
    setLoading(userId)
    try {
      await adminUpdateUserPlan(userId, plan)
      toast.success("Plan mis à jour")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    }
    setLoading(null)
  }

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    setLoading(userId)
    try {
      await adminToggleAdmin(userId)
      toast.success(currentIsAdmin ? "Droits admin retirés" : "Droits admin accordés")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    }
    setLoading(null)
  }

  const handleDelete = (userId: string, email: string) => {
    setConfirmDialog({
      open: true,
      title: "Supprimer cet utilisateur",
      description: `L'utilisateur ${email} et toutes ses données (entreprise, clients, devis, factures) seront définitivement supprimés. Cette action est irréversible.`,
      confirmLabel: "Supprimer",
      variant: "destructive",
      onConfirm: async () => {
        setLoading(userId)
        try {
          await adminDeleteUser(userId)
          toast.success("Utilisateur supprimé")
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Erreur")
        }
        setLoading(null)
        setConfirmDialog((prev) => ({ ...prev, open: false }))
      },
    })
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Aucun utilisateur</h3>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Nom</TableHead>
                <TableHead className="hidden md:table-cell">Entreprise</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="hidden md:table-cell">Inscrit le</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {user.name || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {user.companyName || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.plan}
                      onValueChange={(value) => handlePlanChange(user.id, value as Plan)}
                      disabled={loading === user.id}
                    >
                      <SelectTrigger className="h-8 w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(PLAN_LABELS) as Plan[]).map((plan) => (
                          <SelectItem key={plan} value={plan}>
                            {PLAN_LABELS[plan]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    {user.isAdmin ? (
                      <Badge variant="default">Admin</Badge>
                    ) : (
                      <Badge variant="secondary">User</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={loading === user.id}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleAdmin(user.id, user.isAdmin)}>
                          {user.isAdmin ? (
                            <>
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Retirer admin
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4" />
                              Rendre admin
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(user.id, user.email)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
      />
    </>
  )
}
