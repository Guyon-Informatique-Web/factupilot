"use server"

// Server actions pour l'onboarding entreprise
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schéma de validation du formulaire d'onboarding
const onboardingSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1, "Le nom de l'entreprise est requis"),
  siret: z.string().regex(/^\d{14}$/, "Le SIRET doit contenir exactement 14 chiffres").or(z.literal("")),
  siren: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Email invalide").or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  vatRegime: z.enum(["FRANCHISE", "NORMAL"]),
  legalForm: z.enum(["EI", "EURL", "SASU", "SARL", "SAS", "OTHER"]),
  activityType: z.enum(["ARTISAN_BTP", "FREELANCE_TECH", "CONSULTANT", "COMMERCE", "SERVICES", "OTHER"]),
  apeCode: z.string().optional().or(z.literal("")),
})

export type OnboardingFormData = z.infer<typeof onboardingSchema>

// Résultat structuré — plus de redirect() dans le server action
type CreateCompanyResult =
  | { success: true }
  | { success: false; errors: Record<string, string> }

export async function createCompany(data: OnboardingFormData): Promise<CreateCompanyResult> {
  // Valider avec safeParse pour retourner les erreurs structurées
  const result = onboardingSchema.safeParse(data)

  if (!result.success) {
    const errors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      if (issue.path[0]) errors[String(issue.path[0])] = issue.message
    }
    return { success: false, errors }
  }

  const validated = result.data

  // Vérifier qu'il n'existe pas déjà un profil pour cet utilisateur
  const existing = await prisma.company.findUnique({
    where: { userId: validated.userId },
  })
  if (existing) {
    return { success: true }
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

  return { success: true }
}
