"use server"

// Server actions pour l'onboarding entreprise
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { z } from "zod"

// Schéma de validation du formulaire d'onboarding
const onboardingSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1, "Le nom de l'entreprise est requis"),
  siret: z.string().length(14, "Le SIRET doit contenir 14 chiffres").regex(/^\d+$/, "Le SIRET ne doit contenir que des chiffres").optional().or(z.literal("")),
  siren: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  vatRegime: z.enum(["FRANCHISE", "NORMAL"]),
  legalForm: z.enum(["EI", "EURL", "SASU", "SARL", "SAS", "OTHER"]),
  activityType: z.enum(["ARTISAN_BTP", "FREELANCE_TECH", "CONSULTANT", "COMMERCE", "SERVICES", "OTHER"]),
  apeCode: z.string().optional().or(z.literal("")),
})

export type OnboardingFormData = z.infer<typeof onboardingSchema>

export async function createCompany(data: OnboardingFormData) {
  // Valider les données
  const validated = onboardingSchema.parse(data)

  // Vérifier qu'il n'existe pas déjà un profil pour cet utilisateur
  const existing = await prisma.company.findUnique({
    where: { userId: validated.userId },
  })
  if (existing) {
    redirect("/dashboard")
  }

  // Créer le profil entreprise
  await prisma.company.create({
    data: {
      userId: validated.userId,
      name: validated.name,
      siret: validated.siret || null,
      siren: validated.siren || validated.siret?.slice(0, 9) || null,
      address: validated.address || null,
      city: validated.city || null,
      zipCode: validated.zipCode || null,
      phone: validated.phone || null,
      email: validated.email || null,
      website: validated.website || null,
      vatRegime: validated.vatRegime,
      legalForm: validated.legalForm,
      activityType: validated.activityType,
      apeCode: validated.apeCode || null,
    },
  })

  redirect("/dashboard")
}
