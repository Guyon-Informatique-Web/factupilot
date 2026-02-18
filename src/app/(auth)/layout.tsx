// Layout des pages d'authentification
// Force le rendu dynamique (les composants auth utilisent Supabase au runtime)
export const dynamic = "force-dynamic"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-slate-50 dark:from-gray-950 dark:to-gray-900 px-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
