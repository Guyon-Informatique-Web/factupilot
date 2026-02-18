import { publicEnvVars } from "./load-common-env";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Variables d'environnement du fichier commun SaaS/.env.local
  env: publicEnvVars,
};

export default nextConfig;
