// Page admin — vue lecture seule de tous les documents
import { prisma } from "@/lib/prisma"
import { AdminDocumentList } from "@/components/dashboard/admin/AdminDocumentList"

export default async function AdminDocumentsPage() {
  const [invoices, quotes] = await Promise.all([
    prisma.invoice.findMany({
      include: {
        client: { select: { name: true } },
        company: { select: { name: true, userId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.quote.findMany({
      include: {
        client: { select: { name: true } },
        company: { select: { name: true, userId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ])

  return (
    <AdminDocumentList
      invoices={invoices.map((inv) => ({
        id: inv.id,
        type: "invoice" as const,
        number: inv.number,
        status: inv.status,
        clientName: inv.client.name,
        companyName: inv.company.name,
        totalTtc: Number(inv.totalTtc),
        createdAt: inv.createdAt,
        archivedAt: inv.archivedAt,
      }))}
      quotes={quotes.map((q) => ({
        id: q.id,
        type: "quote" as const,
        number: q.number,
        status: q.status,
        clientName: q.client.name,
        companyName: q.company.name,
        totalTtc: Number(q.totalTtc),
        createdAt: q.createdAt,
        archivedAt: q.archivedAt,
      }))}
    />
  )
}
