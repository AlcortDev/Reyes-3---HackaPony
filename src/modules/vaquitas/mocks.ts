// Datos falsos para avanzar la UI mientras se conecta Prisma. Bórralos cuando queries.ts use la BD.
import type { VaquitaDetalleDTO } from "./types";

const enDosDias = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

export const VAQUITAS_MOCK: VaquitaDetalleDTO[] = [
  {
    id: "vaq-coca",
    productoId: "p-coca",
    producto: "Coca-Cola 600 ml",
    proveedor: "Central de Abastos Morelia",
    metaUnidades: 100,
    totalAportado: 70,
    faltan: 30,
    porcentaje: 70,
    precioMenudeo: 18,
    precioMayoreo: 14.5,
    estado: "ABIERTA",
    cierraEn: enDosDias,
    aportaciones: [
      { tiendaId: "t-guero", tienda: "Miscelánea El Güero", cantidad: 40 },
      { tiendaId: "t-esperanza", tienda: "Tienda La Esperanza", cantidad: 30 },
    ],
  },
];
