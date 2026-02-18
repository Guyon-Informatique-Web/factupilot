// Liste des factures
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { InvoiceList } from "@/components/dashboard/InvoiceList"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import Link from "next/link"

export default async function InvoicesPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) redirect("/dashboard/onboarding")

  const invoices = await prisma.invoice.findMany({
    where: { companyId: company.id },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Factures</h1>
        <div className="flex items-center gap-2">
          <a href="/api/invoices/export">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </a>
          <Link href="/dashboard/invoices/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle facture
            </Button>
          </Link>
        </div>
      </div>
      <InvoiceList invoices={invoices.map((inv) => ({
        ...inv,
        totalHt: Number(inv.totalHt),
        totalTtc: Number(inv.totalTtc),
      }))} vatRegime={company.vatRegime} />
    </div>
  )
}
