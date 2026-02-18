// Layout marketing : Header + contenu + Footer
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* TODO: Header marketing */}
      <main className="flex-1">{children}</main>
      {/* TODO: Footer marketing */}
    </div>
  )
}
