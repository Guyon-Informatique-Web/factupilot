"use server"

// Server actions pour la gestion des clients
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { canCreateClient } from "@/lib/plan-limits"

const clientSchema = z.object({
  name: z.string().min(1, "Le nom du client est requis"),
  siret: z.string().optional().or(z.literal("")),
  siren: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
})

export type ClientFormData = z.infer<typeof clientSchema>

// Récupérer la company et le user connecté
async function getUserCompany() {
  const user = await requireUser()
  const company = await prisma.company.findUnique({
    where: { userId: user.id },
  })
  if (!company) throw new Error("Profil entreprise non configuré")
  return { company, user }
}

export async function createClient(data: ClientFormData) {
  const { company, user } = await getUserCompany()

  // Vérifier les limites du plan
  const check = await canCreateClient(user.id, user.plan)
  if (!check.allowed) throw new Error(check.message)

  const validated = clientSchema.parse(data)

  await prisma.client.create({
    data: {
      companyId: company.id,
      name: validated.name,
      siret: validated.siret || null,
      siren: validated.siren || validated.siret?.slice(0, 9) || null,
      address: validated.address || null,
      city: validated.city || null,
      zipCode: validated.zipCode || null,
      email: validated.email || null,
      phone: validated.phone || null,
      notes: validated.notes || null,
    },
  })

  revalidatePath("/dashboard/clients")
}

export async function updateClient(clientId: string, data: ClientFormData) {
  const { company } = await getUserCompany()
  const validated = clientSchema.parse(data)

  // Vérifier que le client appartient bien à l'utilisateur
  const client = await prisma.client.findFirst({
    where: { id: clientId, companyId: company.id },
  })
  if (!client) throw new Error("Client introuvable")

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name: validated.name,
      siret: validated.siret || null,
      siren: validated.siren || validated.siret?.slice(0, 9) || null,
      address: validated.address || null,
      city: validated.city || null,
      zipCode: validated.zipCode || null,
      email: validated.email || null,
      phone: validated.phone || null,
      notes: validated.notes || null,
    },
  })

  revalidatePath("/dashboard/clients")
}

export async function archiveClient(clientId: string) {
  const { company } = await getUserCompany()

  const client = await prisma.client.findFirst({
    where: { id: clientId, companyId: company.id },
  })
  if (!client) throw new Error("Client introuvable")

  await prisma.client.update({
    where: { id: clientId },
    data: { archivedAt: new Date() },
  })

  revalidatePath("/dashboard/clients")
}

export async function restoreClient(clientId: string) {
  const { company } = await getUserCompany()

  const client = await prisma.client.findFirst({
    where: { id: clientId, companyId: company.id },
  })
  if (!client) throw new Error("Client introuvable")

  await prisma.client.update({
    where: { id: clientId },
    data: { archivedAt: null },
  })

  revalidatePath("/dashboard/clients")
}
