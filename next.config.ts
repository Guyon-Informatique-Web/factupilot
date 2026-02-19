import { publicEnvVars } from "./load-common-env";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Variables d'environnement du fichier commun SaaS/.env.local
  env: publicEnvVars,
  // node-zugferd et xsd-schema-validator doivent rester en Node.js (pas de bundling webpack)
  serverExternalPackages: ["node-zugferd", "xsd-schema-validator"],
};

export default nextConfig;
