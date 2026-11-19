export type NivelStock = "ok" | "bajo" | "critico"; // 🟢 | 🟡 | 🔴  [RN-01]

export interface ItemInventarioDTO {
  id: string; // Inventario.id
  productoId: string;
  nombre: string;
  categoria: string;
  unidad: string;
  imagen: string | null;
  precioMenudeo: number;
  stock: number;
  stockMinimo: number;
  nivel: NivelStock;
}

export interface MovimientoDTO {
  id: string;
  tipo: "ENTRADA" | "SALIDA";
  cantidad: number;
  fecha: string; // ISO
}

export interface DetalleInventarioDTO extends ItemInventarioDTO {
  movimientos: MovimientoDTO[];
  diasParaAgotarse: number | null; // [RN-07]
}

/** [RF-INV-11] Producto del catálogo que la tienda puede agregar a su inventario. */
export interface ProductoParaAgregarDTO {
  id: string;
  nombre: string;
  categoria: string;
  unidad: string;
  precioMenudeo: number;
  codigoBarras: string | null;
}
