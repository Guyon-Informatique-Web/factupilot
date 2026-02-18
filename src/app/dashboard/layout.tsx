// Layout dashboard : Sidebar + Header + contenu principal
// Force le rendu dynamique (toutes les pages dashboard nécessitent Supabase)
export const dynamic = "force-dynamic"

import { Sidebar } from "@/components/dashboard/Sidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { Toaster } from "sonner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar (cachée sur mobile) */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Contenu principal */}
      <div className="flex flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  )
}
