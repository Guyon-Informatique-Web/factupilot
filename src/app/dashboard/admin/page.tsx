// Page statistiques admin — vue d'ensemble de la plateforme
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Receipt, CreditCard } from "lucide-react"

const formatEuro = (amount: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount)

export default async function AdminPage() {
  // Statistiques agrégées
  const [userCount, invoiceStats, quoteCount, activeSubscriptions] = await Promise.all([
    prisma.user.count(),
    prisma.invoice.aggregate({
      _count: true,
      _sum: { totalTtc: true },
      where: { status: "PAID" },
    }),
    prisma.quote.count(),
    prisma.user.count({
      where: {
        plan: { not: "FREE" },
        stripeSubscriptionId: { not: null },
      },
    }),
  ])

  const totalRevenue = Number(invoiceStats._sum.totalTtc ?? 0)

  const stats = [
    {
      title: "Utilisateurs",
      value: userCount,
      icon: Users,
      description: "inscrits sur la plateforme",
    },
    {
      title: "Chiffre d'affaires total",
      value: formatEuro(totalRevenue),
      icon: CreditCard,
      description: `${invoiceStats._count} factures payées`,
    },
    {
      title: "Documents",
      value: invoiceStats._count + quoteCount,
      icon: FileText,
      description: `${quoteCount} devis, ${invoiceStats._count} factures`,
    },
    {
      title: "Abonnements actifs",
      value: activeSubscriptions,
      icon: Receipt,
      description: "utilisateurs payants",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
