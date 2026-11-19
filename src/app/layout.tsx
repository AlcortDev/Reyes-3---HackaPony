import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Vaquita",
  description: "Inventario rápido y compras en grupo para tienditas de colonia",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body className="min-h-dvh antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
