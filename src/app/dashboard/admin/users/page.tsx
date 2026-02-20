// Page admin — liste des utilisateurs
import { prisma } from "@/lib/prisma"
import { AdminUserList } from "@/components/dashboard/admin/AdminUserList"

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: {
      company: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <AdminUserList
      users={users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        plan: u.plan,
        isAdmin: u.isAdmin,
        companyName: u.company?.name ?? null,
        createdAt: u.createdAt,
      }))}
    />
  )
}
