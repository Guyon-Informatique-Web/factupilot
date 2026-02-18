// Configuration Prisma pour Supabase (connexion poolée + directe)
// Les URLs viennent du fichier commun SaaS/.env.local

import "./load-common-env";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
