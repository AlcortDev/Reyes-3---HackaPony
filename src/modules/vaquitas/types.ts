import type { EstadoCanasta } from "@/shared/types";

export interface VaquitaDTO {
  id: string;
  productoId: string;
  producto: string;
  unidad?: string;
  proveedor: string;
  metaUnidades: number;
  totalAportado: number;
  faltan: number;
  porcentaje: number;
  precioMenudeo: number;
  precioMayoreo: number;
  estado: EstadoCanasta; // ya evaluado con RN-08
  cierraEn: string; // ISO
}

export interface AportacionPorTiendaDTO {
  tiendaId: string;
  tienda: string;
  cantidad: number;
}

/** Mismo shape que GET /api/canastas/[id] (SRS §6.2) */
export interface VaquitaDetalleDTO extends VaquitaDTO {
  aportaciones: AportacionPorTiendaDTO[];
}

export interface AportacionDTO {
  vaquitaId: string;
  producto: string;
  cantidad: number;
  precioMenudeo: number;
  precioMayoreo: number;
  estado: EstadoCanasta;
}

export interface ProductoCatalogoDTO {
  id: string;
  nombre: string;
  categoria: string;
  unidad: string;
  precioMenudeo: number;
  /** Del catálogo (lo define el admin). null = todavía sin precio de mayoreo. */
  precioMayoreo: number | null;
  tieneVaquitaAbierta: boolean;
}
