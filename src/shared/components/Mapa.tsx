"use client";
// Envoltura del mapa: Leaflet usa `window`, así que se carga solo en el navegador.
import dynamic from "next/dynamic";
import type { PropsMapa } from "./MapaLeaflet";

export const Mapa = dynamic<PropsMapa>(() => import("./MapaLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 w-full items-center justify-center rounded-lg border bg-muted text-muted-foreground">
      Cargando mapa…
    </div>
  ),
});

/** Centro por defecto: Colonia Chapultepec Norte, Morelia. */
export const CENTRO_MORELIA = { lat: 19.7009, lng: -101.1804 } as const;
