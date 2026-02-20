// Template React Email pour les alertes d'erreur systeme
// Email envoye a l'admin quand une erreur ERROR/CRITICAL survient

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

interface ErrorAlertEmailProps {
  level: string
  category: string
  message: string
  file?: string | null
  line?: number | null
  requestMethod?: string | null
  requestUri?: string | null
  requestIp?: string | null
  trace?: string | null
  environment: string
  timestamp: string
}

export function ErrorAlertEmail({
  level,
  category,
  message,
  file,
  line,
  requestMethod,
  requestUri,
  requestIp,
  trace,
  environment,
  timestamp,
}: ErrorAlertEmailProps) {
  const isProduction = environment === "production"

  return (
    <Html>
      <Head />
      <Preview>
        [{level}] {category} : {message.slice(0, 80)}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header rouge */}
          <Section style={header}>
            <Text style={headerTitle}>ALERTE ERREUR SYSTEME</Text>
            <Text style={headerDate}>{timestamp}</Text>
          </Section>

          {/* Box erreur */}
          <Section style={errorBox}>
            <Text style={errorLabel}>
              {level} - {category}
            </Text>
            <Text style={errorMessage}>{message}</Text>
          </Section>

          {/* Contexte */}
          <Section style={contextSection}>
            <Heading as="h3" style={contextTitle}>
              Contexte
            </Heading>
            <Text style={contextCode}>
              {file && `Fichier : ${file}`}
              {file && line != null && `\nLigne : ${line}`}
              {requestMethod && `\nMethode : ${requestMethod}`}
              {requestUri && `\nURL : ${requestUri}`}
              {requestIp && `\nIP : ${requestIp}`}
            </Text>
            {trace && (
              <>
                <Heading as="h3" style={contextTitle}>
                  Stack trace
                </Heading>
                <Text style={traceCode}>{trace.slice(0, 1500)}</Text>
              </>
            )}
          </Section>

          {/* Actions */}
          <Section style={actionsSection}>
            <Heading as="h3" style={actionsTitle}>
              Actions recommandees
            </Heading>
            <Text style={actionsList}>
              1. Verifier les logs serveur{"\n"}
              2. Identifier la cause racine{"\n"}
              3. Corriger et deployer un fix
            </Text>
          </Section>

          {/* Badge environnement */}
          <Section style={envSection}>
            <Text
              style={{
                ...envBadge,
                backgroundColor: isProduction ? "#DC2626" : "#D97706",
              }}
            >
              {isProduction ? "Production" : "Developpement"}
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Text style={footer}>
            Cet email a ete envoye automatiquement par FactuPilot.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles inline pour compatibilite email
const main = {
  backgroundColor: "#F9FAFB",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
}

const header = {
  background: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)",
  borderRadius: "8px 8px 0 0",
  padding: "24px",
  textAlign: "center" as const,
}

const headerTitle = {
  color: "#FFFFFF",
  fontSize: "20px",
  fontWeight: "bold" as const,
  margin: "0 0 4px 0",
  letterSpacing: "1px",
}

const headerDate = {
  color: "#FCA5A5",
  fontSize: "13px",
  margin: "0",
}

const errorBox = {
  backgroundColor: "#FEF2F2",
  border: "1px solid #FECACA",
  borderRadius: "0 0 8px 8px",
  padding: "20px",
  marginBottom: "20px",
}

const errorLabel = {
  color: "#991B1B",
  fontSize: "12px",
  fontWeight: "600" as const,
  textTransform: "uppercase" as const,
  margin: "0 0 8px 0",
  letterSpacing: "0.5px",
}

const errorMessage = {
  color: "#DC2626",
  fontSize: "16px",
  fontWeight: "500" as const,
  margin: "0",
  lineHeight: "24px",
}

const contextSection = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "16px",
}

const contextTitle = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: "#374151",
  margin: "0 0 8px 0",
}

const contextCode = {
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: "13px",
  color: "#4B5563",
  margin: "0",
  lineHeight: "20px",
  whiteSpace: "pre-wrap" as const,
}

const traceCode = {
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: "11px",
  color: "#6B7280",
  margin: "0",
  lineHeight: "16px",
  whiteSpace: "pre-wrap" as const,
  wordBreak: "break-all" as const,
}

const actionsSection = {
  backgroundColor: "#FFFBEB",
  border: "1px solid #FDE68A",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "16px",
}

const actionsTitle = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: "#92400E",
  margin: "0 0 8px 0",
}

const actionsList = {
  fontSize: "13px",
  color: "#78350F",
  margin: "0",
  lineHeight: "22px",
  whiteSpace: "pre-wrap" as const,
}

const envSection = {
  textAlign: "center" as const,
  marginBottom: "16px",
}

const envBadge = {
  display: "inline-block" as const,
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: "600" as const,
  padding: "4px 12px",
  borderRadius: "12px",
  margin: "0",
}

const hr = {
  borderColor: "#E5E7EB",
  margin: "24px 0",
}

const footer = {
  fontSize: "12px",
  color: "#9CA3AF",
  textAlign: "center" as const,
}
