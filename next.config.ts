import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sin esto Turbopack sube buscando lockfiles y encuentra uno suelto en
  // C:\Users\danie, fuera del repo.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },

  // `pg` es nativo: que no lo intente empaquetar el bundler del servidor.
  serverExternalPackages: ["pg"],
};

export default nextConfig;
