// PWA: al "Agregar a pantalla de inicio" el celular usa estos colores e ícono para su propia splash.
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "La Vaquita",
    short_name: "La Vaquita",
    description: "Inventario rápido y compras en grupo para tienditas de colonia",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#15532b",
    theme_color: "#1f7a3f",
    lang: "es-MX",
    icons: [
      { src: "/icono-vaquita.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icono-vaquita-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
