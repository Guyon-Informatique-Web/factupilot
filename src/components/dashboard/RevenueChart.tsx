"use client"

// Graphique d'évolution du CA mensuel (6 derniers mois)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface RevenueChartProps {
  data: { month: string; ca: number }[]
}

// Formater les montants en euros pour le tooltip
function formatEuro(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount)
}

// Tooltip personnalisé
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-sm">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm text-primary">{formatEuro(payload[0].value)}</p>
    </div>
  )
}

export function RevenueChart({ data }: RevenueChartProps) {
  const hasData = data.some((d) => d.ca > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chiffre d&apos;affaires mensuel</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[250px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Aucune facture payée sur les 6 derniers mois.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
              <YAxis className="text-xs" tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}€`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="ca" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
