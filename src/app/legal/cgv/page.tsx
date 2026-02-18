// Conditions Générales de Vente
export default function CgvPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Conditions Générales de Vente</h1>
      <p><em>Dernière mise à jour : février 2026</em></p>

      <h2>Article 1 — Objet</h2>
      <p>
        Les présentes Conditions Générales de Vente (CGV) régissent l&apos;utilisation
        du service en ligne <strong>FactuPilot</strong>, édité par Guyon Informatique & Web.
        FactuPilot est un logiciel SaaS de création et gestion de devis et factures
        destiné aux micro-entrepreneurs, artisans et indépendants.
      </p>

      <h2>Article 2 — Inscription et compte</h2>
      <p>
        L&apos;accès au service nécessite la création d&apos;un compte utilisateur.
        L&apos;utilisateur s&apos;engage à fournir des informations exactes et à maintenir
        la confidentialité de ses identifiants. Toute utilisation du compte est
        réputée faite par le titulaire.
      </p>

      <h2>Article 3 — Plans et tarifs</h2>
      <p>
        FactuPilot propose plusieurs plans tarifaires (Gratuit, Starter, Pro, Business).
        Les tarifs sont indiqués en euros TTC. Les fonctionnalités et limites de chaque
        plan sont détaillées sur la page de tarification du site. L&apos;éditeur se réserve
        le droit de modifier les tarifs avec un préavis de 30 jours.
      </p>

      <h2>Article 4 — Paiement et facturation</h2>
      <p>
        Les abonnements payants sont facturés mensuellement ou annuellement selon le
        choix de l&apos;utilisateur. Le paiement est effectué par carte bancaire via
        la plateforme sécurisée Stripe. L&apos;abonnement est reconduit tacitement
        à chaque échéance.
      </p>

      <h2>Article 5 — Droit de rétractation</h2>
      <p>
        Conformément à l&apos;article L.221-28 du Code de la consommation, le droit de
        rétractation ne s&apos;applique pas aux contrats de fourniture de contenu
        numérique non fourni sur support matériel dont l&apos;exécution a commencé avec
        l&apos;accord du consommateur. En souscrivant un abonnement, l&apos;utilisateur
        accepte l&apos;exécution immédiate du service et renonce à son droit de
        rétractation.
      </p>

      <h2>Article 6 — Résiliation</h2>
      <p>
        L&apos;utilisateur peut résilier son abonnement à tout moment depuis son espace
        de gestion (portail Stripe). La résiliation prend effet à la fin de la période
        en cours. Le compte bascule alors sur le plan Gratuit. Les données sont
        conservées pendant 12 mois après la résiliation.
      </p>

      <h2>Article 7 — Responsabilité</h2>
      <p>
        FactuPilot est un outil d&apos;aide à la facturation. L&apos;utilisateur reste
        seul responsable du contenu de ses documents et de leur conformité avec
        la législation applicable (Code de commerce, CGI). L&apos;éditeur ne saurait
        être tenu responsable des conséquences d&apos;une utilisation non conforme.
      </p>

      <h2>Article 8 — Disponibilité du service</h2>
      <p>
        L&apos;éditeur s&apos;efforce de maintenir le service accessible 24h/24.
        Cependant, la responsabilité de l&apos;éditeur ne saurait être engagée en cas
        d&apos;indisponibilité temporaire liée à des opérations de maintenance, des
        mises à jour ou des événements de force majeure.
      </p>

      <h2>Article 9 — Propriété des données</h2>
      <p>
        Les données saisies par l&apos;utilisateur (clients, devis, factures) lui
        appartiennent. L&apos;utilisateur peut exporter ses données à tout moment
        au format PDF. En cas de suppression du compte, les données sont
        effacées dans un délai de 30 jours.
      </p>

      <h2>Article 10 — Droit applicable et litiges</h2>
      <p>
        Les présentes CGV sont soumises au droit français. En cas de litige,
        les parties s&apos;engagent à rechercher une solution amiable avant toute
        action judiciaire. À défaut, les tribunaux compétents seront ceux du
        ressort du siège de l&apos;éditeur.
      </p>
    </article>
  )
}
