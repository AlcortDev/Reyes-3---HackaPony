"use client";
// Mapa con un pin (Leaflet + OpenStreetMap). NO importar directo: usa <Mapa> (carga solo en el navegador).
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

export interface PropsMapa {
  lat: number;
  lng: number;
  /** Si se pasa, el pin se puede arrastrar y el mapa acepta toques para moverlo. */
  onCambio?: (lat: number, lng: number) => void;
  zoom?: number;
  className?: string;
}

// Ícono propio (evita las imágenes por defecto de Leaflet, que se rompen con bundlers y CSP)
const icono = L.divIcon({
  className: "",
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48" aria-hidden="true">
    <path d="M20 47s16-15.6 16-28A16 16 0 0 0 4 19c0 12.4 16 28 16 28z" fill="#1f7a3f" stroke="#fff" stroke-width="2.5"/>
    <circle cx="20" cy="19" r="6.5" fill="#fff"/></svg>`,
  iconSize: [40, 48],
  iconAnchor: [20, 46],
});

function Recentrar({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

function ClicParaMover({ onCambio }: { onCambio: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onCambio(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function MapaLeaflet({ lat, lng, onCambio, zoom = 16, className }: PropsMapa) {
  const editable = !!onCambio;
  const eventos = useMemo(
    () => ({
      dragend: (e: L.DragEndEvent) => {
        const p = (e.target as L.Marker).getLatLng();
        onCambio?.(p.lat, p.lng);
      },
    }),
    [onCambio],
  );

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      className={className ?? "h-72 w-full rounded-lg border"}
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={icono} draggable={editable} eventHandlers={eventos} />
      <Recentrar lat={lat} lng={lng} />
      {editable && <ClicParaMover onCambio={onCambio} />}
    </MapContainer>
  );
}
