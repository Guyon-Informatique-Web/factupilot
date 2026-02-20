"use client"

// Journal d'erreurs système (admin)
import { useState } from "react"
import { adminResolveLog } from "@/app/dashboard/admin/actions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ErrorLog {
  id: string
  level: string
  category: string
  message: string
  file: string | null
  line: number | null
  requestUri: string | null
  userId: string | null
  resolvedAt: Date | null
  createdAt: Date
}

interface AdminLogListProps {
  logs: ErrorLog[]
}

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(date))

export function AdminLogList({ logs }: AdminLogListProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleResolve = async (logId: string) => {
    setLoading(logId)
    try {
      await adminResolveLog(logId)
      toast.success("Log marqué comme résolu")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    }
    setLoading(null)
  }

  const unresolvedLogs = logs.filter((log) => !log.resolvedAt)
  const resolvedLogs = logs.filter((log) => log.resolvedAt)

  const renderTable = (logList: ErrorLog[], showResolveButton: boolean) => {
    if (logList.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Aucun log</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {showResolveButton ? "Aucune erreur à traiter." : "Aucun log résolu."}
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Niveau</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="hidden md:table-cell">Fichier</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                {showResolveButton && <TableHead className="w-[100px]">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {logList.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant={log.level === "CRITICAL" ? "destructive" : "secondary"}>
                      {log.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.category}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate" title={log.message}>
                    {log.message}
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs">
                    {log.file ? `${log.file}${log.line ? `:${log.line}` : ""}` : "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  {showResolveButton && (
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loading === log.id}
                        onClick={() => handleResolve(log.id)}
                      >
                        {loading === log.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-1 h-4 w-4" />
                        )}
                        Résoudre
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <span className="text-sm font-medium">
          {unresolvedLogs.length} erreur{unresolvedLogs.length > 1 ? "s" : ""} non résolue{unresolvedLogs.length > 1 ? "s" : ""}
        </span>
      </div>

      <Tabs defaultValue="unresolved">
        <TabsList>
          <TabsTrigger value="unresolved">Non résolues ({unresolvedLogs.length})</TabsTrigger>
          <TabsTrigger value="resolved">Résolues ({resolvedLogs.length})</TabsTrigger>
          <TabsTrigger value="all">Tous ({logs.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="unresolved" className="mt-4">{renderTable(unresolvedLogs, true)}</TabsContent>
        <TabsContent value="resolved" className="mt-4">{renderTable(resolvedLogs, false)}</TabsContent>
        <TabsContent value="all" className="mt-4">{renderTable(logs, true)}</TabsContent>
      </Tabs>
    </div>
  )
}
