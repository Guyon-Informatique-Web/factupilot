// Gestionnaire d'erreurs global Next.js
// Capture les erreurs React non gerees et les log

"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Envoyer l'erreur au serveur pour logging
    fetch("/api/error-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        trace: error.stack,
        digest: error.digest,
      }),
    }).catch(() => {
      // Silencieux si le log echoue
    })
  }, [error])

  return (
    <html lang="fr">
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            fontFamily: "system-ui, sans-serif",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "24px", marginBottom: "16px", color: "#111827" }}>
            Une erreur est survenue
          </h1>
          <p style={{ color: "#6B7280", marginBottom: "24px", maxWidth: "400px" }}>
            Nous sommes desoles, une erreur inattendue s&apos;est produite.
            Notre equipe a ete notifiee.
          </p>
          <button
            onClick={reset}
            style={{
              backgroundColor: "#4F46E5",
              color: "#FFFFFF",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Reessayer
          </button>
        </div>
      </body>
    </html>
  )
}
