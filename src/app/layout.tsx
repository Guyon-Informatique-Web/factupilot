import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "FactuPilot — Vos devis et factures en pilote automatique",
    template: "%s — FactuPilot",
  },
  description: "Créez, envoyez et suivez vos devis et factures en quelques clics. Propulsé par l'IA, conforme facturation électronique 2026.",
  keywords: [
    "devis",
    "factures",
    "micro-entrepreneur",
    "facturation électronique",
    "Factur-X",
    "artisan",
    "freelance",
    "auto-entrepreneur",
    "SaaS",
    "IA",
  ],
  authors: [{ name: "Guyon Informatique & Web", url: "https://guyon-informatique-web.fr" }],
  creator: "Guyon Informatique & Web",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "FactuPilot",
    title: "FactuPilot — Vos devis et factures en pilote automatique",
    description: "Créez, envoyez et suivez vos devis et factures en quelques clics. Propulsé par l'IA, conforme facturation électronique 2026.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "FactuPilot" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FactuPilot — Vos devis et factures en pilote automatique",
    description: "Créez, envoyez et suivez vos devis et factures en quelques clics. Propulsé par l'IA, conforme facturation électronique 2026.",
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
