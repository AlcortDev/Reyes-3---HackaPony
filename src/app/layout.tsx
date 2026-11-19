import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import { Toaster } from "sonner";
import { SCRIPT_SPLASH, Splash } from "@/shared/components/Splash";
import "./globals.css";

// Nunito para leer; Baloo 2 para títulos con aire de rótulo de tiendita.
// next/font las sirve desde nuestro propio dominio (CSP font-src 'self').
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });
const baloo = Baloo_2({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-baloo", display: "swap" });

export const metadata: Metadata = {
  title: { default: "La Vaquita", template: "%s · La Vaquita" },
  description: "Inventario rápido y compras en grupo para tienditas de colonia",
  applicationName: "La Vaquita",
  icons: { icon: "/icono-vaquita.svg", apple: "/icono-vaquita.svg" },
  appleWebApp: { capable: true, title: "La Vaquita", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1f7a3f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // data-splash lo pone el script de abajo antes de hidratar
    <html lang="es-MX" className={`${nunito.variable} ${baloo.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_SPLASH }} />
      </head>
      <body className="min-h-dvh antialiased">
        <Splash />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
