// Datos falsos para avanzar la UI mientras se conecta Prisma. Bórralos cuando queries.ts use la BD.
import type { ItemInventarioDTO } from "./types";

export const INVENTARIO_MOCK: ItemInventarioDTO[] = [
  { id: "inv-1", productoId: "p-coca", nombre: "Coca-Cola 600 ml", categoria: "Bebidas", unidad: "pieza", imagen: null, precioMenudeo: 18, stock: 4, stockMinimo: 6, nivel: "critico" },
  { id: "inv-2", productoId: "p-sabritas", nombre: "Sabritas 45 g", categoria: "Botanas", unidad: "pieza", imagen: null, precioMenudeo: 19, stock: 10, stockMinimo: 6, nivel: "bajo" },
  { id: "inv-3", productoId: "p-maseca", nombre: "Maseca 1 kg", categoria: "Abarrotes", unidad: "bolsa", imagen: null, precioMenudeo: 24, stock: 25, stockMinimo: 5, nivel: "ok" },
];
