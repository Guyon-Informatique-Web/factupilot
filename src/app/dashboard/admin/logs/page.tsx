// Page admin — journal d'erreurs système
import { prisma } from "@/lib/prisma"
import { AdminLogList } from "@/components/dashboard/admin/AdminLogList"

export default async function AdminLogsPage() {
  const logs = await prisma.errorLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return (
    <AdminLogList
      logs={logs.map((log) => ({
        id: log.id,
        level: log.level,
        category: log.category,
        message: log.message,
        file: log.file,
        line: log.line,
        requestUri: log.requestUri,
        userId: log.userId,
        resolvedAt: log.resolvedAt,
        createdAt: log.createdAt,
      }))}
    />
  )
}
