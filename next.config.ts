import type { NextConfig } from "next";

// Exportación estática: la app es solo HTML/CSS/JS, sin servidor.
// El service worker (scripts/generar-sw.mjs) la guarda completa para usarla sin conexión.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // La raíz del proyecto es esta carpeta.
  turbopack: { root: __dirname },
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
