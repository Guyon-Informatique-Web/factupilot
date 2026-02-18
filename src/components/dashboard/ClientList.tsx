"use client"

// Liste des clients avec actions rapides
import { archiveClient } from "@/app/dashboard/clients/actions"
import { ClientDialog } from "@/components/dashboard/ClientDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Archive, Mail, Phone, Users, Search, Eye } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useState, useMemo } from "react"

interface Client {
  id: string
  name: string
  siret: string | null
  siren: string | null
  address: string | null
  city: string | null
  zipCode: string | null
  email: string | null
  phone: string | null
  notes: string | null
}

interface ClientListProps {
  clients: Client[]
}

export function ClientList({ clients }: ClientListProps) {
  const [archiving, setArchiving] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const handleArchive = async (clientId: string) => {
    setArchiving(clientId)
    try {
      await archiveClient(clientId)
      toast.success("Client archivé")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'archivage")
    }
    setArchiving(null)
  }

  // Filtrer par recherche (nom, email, ville)
  const filtered = useMemo(() => {
    if (!search.trim()) return clients
    const q = search.toLowerCase()
    return clients.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q))
    )
  }, [clients, search])

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Aucun client</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Ajoutez votre premier client pour commencer à créer des devis.
          </p>
          <div className="mt-4">
            <ClientDialog />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, email ou ville..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Téléphone</TableHead>
              <TableHead className="hidden lg:table-cell">Ville</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/clients/${client.id}`} className="hover:underline">
                    {client.name}
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {client.email ? (
                    <span className="flex items-center gap-1 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {client.email}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {client.phone ? (
                    <span className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {client.phone}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {client.city || <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <ClientDialog client={client} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/clients/${client.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir le détail
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleArchive(client.id)}
                          disabled={archiving === client.id}
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archiver
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </div>
  )
}
