// [RF-INV-11] Alta de un producto en el inventario de la tienda: del catálogo o uno nuevo.
// Esquema compartido por el formulario (cliente) y la server action (servidor).
import { z } from "zod";

const entero = (max: number, mensaje: string) =>
  z.number({ invalid_type_error: mensaje }).int(mensaje).min(0, mensaje).max(max, mensaje);

export const productoNuevoSchema = z.object({
  tipo: z.literal("nuevo"),
  nombre: z.string().trim().min(2, "Escribe el nombre del producto").max(80),
  categoria: z.string().trim().min(2, "Escribe la categoría (ej. Abarrotes)").max(40),
  unidad: z.string().trim().min(1, "Escribe la unidad (ej. pieza, kg)").max(30),
  precioMenudeo: z
    .number({ invalid_type_error: "Escribe el precio" })
    .positive("El precio debe ser mayor a $0")
    .max(100_000, "Revisa el precio"),
  // Vacío = sin código. Solo dígitos, letras y guion (EAN/UPC/Code128).
  codigoBarras: z
    .string()
    .trim()
    .max(64, "El código es muy largo")
    .regex(/^[0-9A-Za-z-]*$/, "El código solo lleva números y letras")
    .optional()
    .transform((c) => (c ? c : undefined)),
});

export const altaInventarioSchema = z.object({
  producto: z.discriminatedUnion("tipo", [
    z.object({ tipo: z.literal("catalogo"), productoId: z.string().trim().min(1, "Elige un producto").max(128) }),
    productoNuevoSchema,
  ]),
  stockInicial: entero(1_000_000, "Escribe cuántas tienes (número entero, 0 o más)"), // [RN-02, RN-03]
  stockMinimo: entero(100_000, "Escribe el mínimo (número entero, 0 o más)"),
});

export type AltaInventarioInput = z.input<typeof altaInventarioSchema>;
