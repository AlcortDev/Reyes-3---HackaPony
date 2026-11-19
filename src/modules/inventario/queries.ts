// Lecturas del inventario. Dueño: Alvaro.
// Quien llama ya validó la sesión (requireTiendaAprobada) y pasa el tiendaId DE LA SESIÓN.
import type { DetalleInventarioDTO, ItemInventarioDTO } from "./types";
import type { Prisma } from "@prisma/client";
import { db } from "@/shared/db";
import { diasParaAgotarse, nivelStock } from "./logic";

type InventarioConProducto = Prisma.InventarioGetPayload<{ include: { producto: true } }>;

function aItem(fila: InventarioConProducto): ItemInventarioDTO {
  return {
    id: fila.id,
    productoId: fila.productoId,
    nombre: fila.producto.nombre,
    categoria: fila.producto.categoria,
    unidad: fila.producto.unidad,
    imagen: fila.producto.imagen,
    precioMenudeo: fila.producto.precioMenudeo,
    stock: fila.stock,
    stockMinimo: fila.stockMinimo,
    nivel: nivelStock(fila.stock, fila.stockMinimo),
  };
}

/** [RF-INV-01, RF-INV-05] */
export async function getInventarioPorTienda(tiendaId: string): Promise<ItemInventarioDTO[]> {
  const filas = await db.inventario.findMany({ where: { tiendaId }, include: { producto: true } });
  const prioridad = { critico: 0, bajo: 1, ok: 2 };
  return filas.map(aItem).sort((a, b) =>
    prioridad[a.nivel] - prioridad[b.nivel] || a.nombre.localeCompare(b.nombre, "es-MX"),
  );
}

/** [RF-INV-06, RF-INV-07] Debe verificar que el inventario pertenezca a tiendaId. */
export async function getDetalleInventario(inventarioId: string, tiendaId: string): Promise<DetalleInventarioDTO | null> {
  return db.$transaction(async (tx) => {
    const fila = await tx.inventario.findFirst({
      where: { id: inventarioId, tiendaId },
      include: {
        producto: true,
        movimientos: { orderBy: [{ fecha: "desc" }, { id: "desc" }], take: 20 },
      },
    });
    if (!fila) return null;

    const ahora = new Date();
    const haceSieteDias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const salidas = await tx.movimiento.aggregate({
      where: {
        inventarioId,
        tipo: "SALIDA",
        fecha: { gte: haceSieteDias, lte: ahora },
        inventario: { tiendaId },
      },
      _sum: { cantidad: true },
    });

    return {
      ...aItem(fila),
      movimientos: fila.movimientos.map(({ id, tipo, cantidad, fecha }) => ({
        id, tipo, cantidad, fecha: fecha.toISOString(),
      })),
      diasParaAgotarse: diasParaAgotarse(fila.stock, salidas._sum.cantidad ?? 0),
    };
  }, { isolationLevel: "RepeatableRead" });
}

/** [RF-INV-04] Contrato usado por vaquitas. */
export async function getProductosBajoStock(tiendaId: string): Promise<ItemInventarioDTO[]> {
  const items = await getInventarioPorTienda(tiendaId);
  return items.filter((i) => i.nivel === "critico");
}
