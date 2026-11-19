import type { NextConfig } from "next";

// Headers de seguridad [RNF-SEC-12]. Hiram los ajusta en el Bloque 3.
// En dev, Next necesita 'unsafe-eval' para el recargado en caliente.
const esDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${esDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=()" },
];

const nextConfig: NextConfig = {
  // Argon2 es un módulo nativo: no se empaqueta.
  serverExternalPackages: ["@node-rs/argon2"],
  experimental: {
    serverActions: {
      // Registro con 3 documentos de hasta 5 MB [RNF-SEC-08]
      bodySizeLimit: "20mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
