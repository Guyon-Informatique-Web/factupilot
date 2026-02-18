// Layout commun des pages légales — header simple + contenu centré
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, ArrowLeft } from "lucide-react"

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FactuPilot</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl flex-1 px-4 py-12">
        {children}
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Guyon Informatique & Web. Tous droits réservés.
      </footer>
    </div>
  )
}
