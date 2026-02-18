// Politique de confidentialité
export default function PolitiqueConfidentialitePage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Politique de confidentialité</h1>
      <p><em>Dernière mise à jour : février 2026</em></p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement des données personnelles est
        Guyon Informatique & Web, micro-entreprise représentée par Valentin Guyon.
        Contact : contact@guyoninformatique.fr.
      </p>

      <h2>2. Données collectées</h2>
      <p>Nous collectons les données suivantes :</p>
      <ul>
        <li><strong>Données de compte :</strong> adresse email, nom, mot de passe (hashé par Supabase)</li>
        <li><strong>Données d&apos;entreprise :</strong> raison sociale, SIRET, adresse, téléphone, email professionnel, régime TVA</li>
        <li><strong>Données clients :</strong> nom, adresse, email, SIRET des clients de l&apos;utilisateur</li>
        <li><strong>Données de facturation :</strong> devis, factures, montants, dates</li>
        <li><strong>Données de paiement :</strong> traitées exclusivement par Stripe (nous ne stockons pas les numéros de carte)</li>
      </ul>

      <h2>3. Finalités du traitement</h2>
      <p>Les données sont utilisées pour :</p>
      <ul>
        <li>Fournir le service de création et gestion de devis et factures</li>
        <li>Gérer votre compte utilisateur et votre abonnement</li>
        <li>Envoyer vos documents par email à vos clients</li>
        <li>Générer des statistiques de votre activité (tableau de bord)</li>
        <li>Assurer le support technique</li>
      </ul>

      <h2>4. Base légale</h2>
      <p>
        Le traitement des données repose sur l&apos;exécution du contrat (fourniture
        du service) et le consentement de l&apos;utilisateur lors de l&apos;inscription.
      </p>

      <h2>5. Durée de conservation</h2>
      <ul>
        <li><strong>Données de compte :</strong> conservées pendant toute la durée d&apos;utilisation du service, puis 12 mois après suppression du compte</li>
        <li><strong>Devis et factures :</strong> conservés conformément aux obligations légales (10 ans pour les documents comptables, art. L.123-22 du Code de commerce)</li>
        <li><strong>Logs de connexion :</strong> 12 mois</li>
      </ul>

      <h2>6. Sous-traitants</h2>
      <p>Les données sont traitées par les sous-traitants suivants :</p>
      <ul>
        <li><strong>Supabase</strong> (authentification et base de données) — Serveurs UE</li>
        <li><strong>Vercel</strong> (hébergement de l&apos;application) — CDN mondial</li>
        <li><strong>Stripe</strong> (paiement en ligne) — Certifié PCI DSS</li>
        <li><strong>Resend</strong> (envoi d&apos;emails transactionnels)</li>
      </ul>

      <h2>7. Transferts hors UE</h2>
      <p>
        Certains sous-traitants (Vercel, Stripe) peuvent traiter des données
        aux États-Unis. Ces transferts sont encadrés par les clauses contractuelles
        types de la Commission européenne et/ou le Data Privacy Framework.
      </p>

      <h2>8. Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez des droits suivants :
      </p>
      <ul>
        <li><strong>Accès :</strong> obtenir une copie de vos données personnelles</li>
        <li><strong>Rectification :</strong> corriger des données inexactes</li>
        <li><strong>Suppression :</strong> demander l&apos;effacement de vos données</li>
        <li><strong>Portabilité :</strong> recevoir vos données dans un format structuré</li>
        <li><strong>Opposition :</strong> vous opposer au traitement de vos données</li>
        <li><strong>Limitation :</strong> demander la limitation du traitement</li>
      </ul>
      <p>
        Pour exercer ces droits, contactez-nous à : contact@guyoninformatique.fr.
        Nous répondrons dans un délai de 30 jours.
      </p>

      <h2>9. Sécurité</h2>
      <p>
        Nous mettons en oeuvre des mesures techniques et organisationnelles
        appropriées pour protéger vos données : chiffrement en transit (HTTPS/TLS),
        authentification sécurisée, accès restreint aux données, sauvegardes
        régulières.
      </p>

      <h2>10. Réclamation</h2>
      <p>
        Si vous estimez que le traitement de vos données constitue une violation
        du RGPD, vous pouvez introduire une réclamation auprès de la CNIL
        (Commission Nationale de l&apos;Informatique et des Libertés) :
        {" "}<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>.
      </p>
    </article>
  )
}
