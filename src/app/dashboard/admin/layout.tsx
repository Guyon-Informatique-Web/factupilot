// Layout administration avec tabs de navigation
import { requireAdmin } from "@/lib/admin"
import Link from "next/link"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Vérifie que l'utilisateur est admin
  await requireAdmin()

  const tabs = [
    { href: "/dashboard/admin", label: "Statistiques" },
    { href: "/dashboard/admin/users", label: "Utilisateurs" },
    { href: "/dashboard/admin/documents", label: "Documents" },
    { href: "/dashboard/admin/logs", label: "Logs d'erreurs" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administration</h1>
        <p className="text-muted-foreground">
          Gestion globale de la plateforme FactuPilot
        </p>
      </div>

      <nav className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[active]:border-primary data-[active]:text-foreground"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  )
}
