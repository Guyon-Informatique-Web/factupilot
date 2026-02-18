// API Route — Recherche SIRENE par numéro SIRET
// Utilise l'API publique api.insee.fr pour préremplir les infos entreprise
import { NextRequest, NextResponse } from "next/server"

// Structure de la réponse simplifiée
interface SireneResult {
  siret: string
  siren: string
  name: string
  address: string
  city: string
  zipCode: string
  apeCode: string
  legalForm: string
}

export async function GET(request: NextRequest) {
  const siret = request.nextUrl.searchParams.get("siret")

  if (!siret || siret.length !== 14) {
    return NextResponse.json(
      { error: "Le numéro SIRET doit contenir exactement 14 chiffres" },
      { status: 400 }
    )
  }

  // Valider que le SIRET ne contient que des chiffres
  if (!/^\d{14}$/.test(siret)) {
    return NextResponse.json(
      { error: "Le numéro SIRET ne doit contenir que des chiffres" },
      { status: 400 }
    )
  }

  try {
    // Utiliser l'API Recherche Entreprises (gouvernement, sans clé API)
    const response = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${siret}&page=1&per_page=1`,
      { next: { revalidate: 86400 } } // Cache 24h
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erreur lors de la recherche. Veuillez réessayer." },
        { status: 502 }
      )
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      return NextResponse.json(
        { error: "Aucune entreprise trouvée avec ce SIRET" },
        { status: 404 }
      )
    }

    const entreprise = data.results[0]

    // Chercher l'établissement correspondant au SIRET exact
    const etablissement = entreprise.matching_etablissements?.find(
      (e: { siret: string }) => e.siret === siret
    ) || entreprise.matching_etablissements?.[0]

    const result: SireneResult = {
      siret: siret,
      siren: entreprise.siren || siret.slice(0, 9),
      name: entreprise.nom_complet || entreprise.nom_raison_sociale || "",
      address: etablissement?.adresse || "",
      city: etablissement?.commune || "",
      zipCode: etablissement?.code_postal || "",
      apeCode: entreprise.activite_principale || "",
      legalForm: entreprise.nature_juridique || "",
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      { error: "Erreur de connexion au service SIRENE" },
      { status: 500 }
    )
  }
}
