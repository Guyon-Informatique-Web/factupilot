// Page liste des devis
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { QuoteList } from "@/components/dashboard/QuoteList"

export const metadata = {
  title: "Devis",
}

export default async function QuotesPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) redirect("/dashboard/onboarding")

  const quotes = await prisma.quote.findMany({
    where: { companyId: company.id },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Devis</h1>
          <p className="text-muted-foreground">
            {quotes.length} devis au total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/quotes/export">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </a>
          <Link href="/dashboard/quotes/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau devis
            </Button>
          </Link>
        </div>
      </div>
      <QuoteList quotes={quotes.map((q) => ({
        ...q,
        totalHt: Number(q.totalHt),
        totalTtc: Number(q.totalTtc),
      }))} vatRegime={company.vatRegime} />
    </div>
  )
}
