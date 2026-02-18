"use server"

// Server actions pour les paramètres entreprise
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const updateCompanySchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  siret: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email invalide").optional().nullable(),
  website: z.string().optional().nullable(),
  vatRegime: z.enum(["FRANCHISE", "NORMAL"]),
  vatNumber: z.string().optional().nullable(),
  legalForm: z.enum(["EI", "EURL", "SASU", "SARL", "SAS", "OTHER"]),
  activityType: z.enum(["ARTISAN_BTP", "FREELANCE_TECH", "CONSULTANT", "COMMERCE", "SERVICES", "OTHER"]),
  quotePrefix: z.string().min(1).max(5),
  invoicePrefix: z.string().min(1).max(5),
  primaryColor: z.string().optional().nullable(),
  customNotes: z.string().optional().nullable(),
})

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>

export async function updateCompany(data: UpdateCompanyInput) {
  const user = await requireUser()

  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) throw new Error("Profil entreprise non trouvé")

  const validated = updateCompanySchema.parse(data)

  await prisma.company.update({
    where: { id: company.id },
    data: {
      ...validated,
      // Nettoyer les chaînes vides en null
      siret: validated.siret || null,
      address: validated.address || null,
      city: validated.city || null,
      zipCode: validated.zipCode || null,
      phone: validated.phone || null,
      email: validated.email || null,
      website: validated.website || null,
      vatNumber: validated.vatNumber || null,
      primaryColor: validated.primaryColor || null,
      customNotes: validated.customNotes || null,
    },
  })

  revalidatePath("/dashboard/settings")
  revalidatePath("/dashboard")
}
