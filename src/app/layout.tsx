import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// Tipografía redondeada y muy legible; next/font la sirve desde nuestro propio dominio (CSP font-src 'self').
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });

export const metadata: Metadata = {
  title: "La Vaquita",
  description: "Inventario rápido y compras en grupo para tienditas de colonia",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1f7a3f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX" className={nunito.variable}>
      <body className="min-h-dvh antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
