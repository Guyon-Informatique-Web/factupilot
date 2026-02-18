// Landing page marketing FactuPilot
export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        Vos devis et factures
        <br />
        <span className="text-primary">en pilote automatique</span>
      </h1>
      <p className="max-w-2xl text-lg text-muted-foreground">
        Créez, envoyez et suivez vos devis et factures en quelques clics.
        Propulsé par l&apos;IA, conforme facturation électronique 2026.
      </p>
      <div className="flex gap-4">
        <a
          href="/register"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Commencer gratuitement
        </a>
        <a
          href="/features"
          className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Découvrir les fonctionnalités
        </a>
      </div>
    </div>
  )
}
