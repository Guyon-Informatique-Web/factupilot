// Landing page marketing FactuPilot
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Zap,
  Shield,
  Mail,
  BarChart3,
  Sparkles,
  Check,
  ArrowRight,
  Star,
} from "lucide-react"
import { PLANS, type PlanType } from "@/config/plans"
import { APP_CONFIG } from "@/config/app"

const FEATURES = [
  {
    icon: FileText,
    title: "Devis et factures pro",
    description: "Créez des devis et factures professionnels en quelques clics. PDF soigné, numérotation automatique.",
  },
  {
    icon: Zap,
    title: "Conversion 1 clic",
    description: "Transformez un devis accepté en facture instantanément. Toutes les données sont recopiées.",
  },
  {
    icon: Shield,
    title: "Conforme 2026",
    description: "Prêt pour la facturation électronique obligatoire. Format Factur-X, mentions légales automatiques.",
  },
  {
    icon: Mail,
    title: "Envoi par email",
    description: "Envoyez vos documents directement par email avec le PDF en pièce jointe. Statut mis à jour automatiquement.",
  },
  {
    icon: BarChart3,
    title: "Tableau de bord",
    description: "CA du mois, factures impayées, seuil micro-entreprise. Toute votre activité en un coup d'oeil.",
  },
  {
    icon: Sparkles,
    title: "IA intégrée",
    description: "Génération de devis par l'IA, suggestions de prix, détection d'erreurs. Gagnez du temps sur chaque document.",
  },
]

const PLAN_ORDER: PlanType[] = ["FREE", "STARTER", "PRO", "BUSINESS"]

const TESTIMONIALS = [
  {
    name: "Marie L.",
    role: "Coiffeuse à domicile",
    text: "Enfin un outil simple pour mes devis ! Je passe 5 minutes au lieu de 30 avec mon ancien tableur.",
  },
  {
    name: "Thomas R.",
    role: "Développeur freelance",
    text: "La conversion devis → facture en un clic, c'est exactement ce qu'il me manquait. Plus d'erreurs de recopie.",
  },
  {
    name: "Sophie M.",
    role: "Plombière",
    text: "Mes clients reçoivent des devis professionnels en PDF directement par email. Ça fait sérieux.",
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">{APP_CONFIG.name}</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#fonctionnalites" className="text-sm text-muted-foreground hover:text-foreground">
              Fonctionnalités
            </a>
            <a href="#tarifs" className="text-sm text-muted-foreground hover:text-foreground">
              Tarifs
            </a>
            <a href="#temoignages" className="text-sm text-muted-foreground hover:text-foreground">
              Témoignages
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Connexion</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Essai gratuit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-24 text-center md:py-32">
          <Badge variant="secondary" className="mb-6">
            Conforme facturation électronique 2026
          </Badge>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            Vos devis et factures en{" "}
            <span className="text-primary">pilote automatique</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Créez, envoyez et suivez vos devis et factures en quelques clics.
            Conçu pour les micro-entrepreneurs et artisans. Propulsé par l&apos;IA.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="text-base">
                Commencer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#fonctionnalites">
              <Button variant="outline" size="lg" className="text-base">
                Découvrir les fonctionnalités
              </Button>
            </a>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Gratuit pour toujours — 3 devis et 3 factures par mois. Sans carte bancaire.
          </p>
        </div>
        {/* Dégradé décoratif */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -top-20 right-1/4 h-60 w-60 rounded-full bg-primary/5 blur-3xl" />
        </div>
      </section>

      <Separator />

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Tout ce qu&apos;il faut pour facturer sereinement
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Des outils pensés pour les indépendants, artisans et freelances.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-none">
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Tarifs */}
      <section id="tarifs" className="scroll-mt-20 bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Un prix adapté à votre activité
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Commencez gratuitement, évoluez selon vos besoins.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PLAN_ORDER.map((planKey) => {
              const plan = PLANS[planKey]
              const isPopular = planKey === "PRO"
              return (
                <Card
                  key={planKey}
                  className={`relative flex flex-col ${isPopular ? "border-primary shadow-lg" : ""}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Le plus populaire</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        {plan.price === 0 ? "0" : plan.price.toFixed(2).replace(".", ",")}
                      </span>
                      <span className="text-muted-foreground">
                        {plan.price === 0 ? " €" : " €/mois"}
                      </span>
                    </div>
                    {plan.yearlyPrice && (
                      <p className="text-xs text-muted-foreground">
                        ou {(plan.yearlyPrice / 12).toFixed(2).replace(".", ",")} €/mois (annuel)
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <ul className="flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6">
                      <Link href="/register" className="block">
                        <Button
                          variant={isPopular ? "default" : "outline"}
                          className="w-full"
                        >
                          {planKey === "FREE" ? "Commencer" : "Essayer gratuitement"}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <Separator />

      {/* Témoignages */}
      <section id="temoignages" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Ils utilisent FactuPilot
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Micro-entrepreneurs, artisans, freelances... ils ont simplifié leur facturation.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name}>
                <CardContent className="pt-6">
                  <div className="mb-4 flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm italic text-muted-foreground">&ldquo;{t.text}&rdquo;</p>
                  <div className="mt-4">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* CTA final */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Prêt à simplifier votre facturation ?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Rejoignez des centaines d&apos;indépendants qui gagnent du temps chaque jour.
            Commencez gratuitement, sans engagement.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button size="lg" className="text-base">
                Créer mon compte gratuit
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-bold">{APP_CONFIG.name}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {APP_CONFIG.tagline}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Produit</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#fonctionnalites" className="hover:text-foreground">Fonctionnalités</a></li>
                <li><a href="#tarifs" className="hover:text-foreground">Tarifs</a></li>
                <li><Link href="/login" className="hover:text-foreground">Connexion</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Légal</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/legal/mentions-legales" className="hover:text-foreground">Mentions légales</Link></li>
                <li><Link href="/legal/cgv" className="hover:text-foreground">CGV</Link></li>
                <li><Link href="/legal/politique-confidentialite" className="hover:text-foreground">Politique de confidentialité</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Contact</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>{APP_CONFIG.email.support}</li>
                <li>
                  <a href={APP_CONFIG.company.website} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                    {APP_CONFIG.company.name}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <Separator className="my-8" />
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {APP_CONFIG.company.name}. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  )
}
