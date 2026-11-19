// Datos de demo [RF-DEM-01, RF-DEM-03] — ver docs/SRS.md §5.4. Dueño: Hiram.
// Ejecutar: npm run db:seed   (lee .env: ADMIN_EMAIL, ADMIN_PASSWORD, SEED_DEMO_PASSWORD, DOCS_ENCRYPTION_KEY)
import { randomUUID } from "node:crypto";
import { PrismaClient, type TipoDocumento } from "@prisma/client";
import sharp from "sharp";
import { cifrar, sha256 } from "../src/shared/security/crypto";
import { hashPassword } from "../src/shared/security/password";

const db = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@lavaquita.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "";

function exigirContrasena(nombre: string, valor: string) {
  if (valor.length < 12) throw new Error(`${nombre} debe tener al menos 12 caracteres (ponlo en .env)`);
}

const DIA = 24 * 60 * 60 * 1000;
const haceDias = (d: number) => new Date(Date.now() - d * DIA);

// Colonia Chapultepec Norte, Morelia (aprox.)
const CENTRO = { lat: 19.7009, lng: -101.1804 };

const PRODUCTOS = [
  { clave: "coca", nombre: "Coca-Cola 600 ml", categoria: "Bebidas", unidad: "pieza", precioMenudeo: 18 },
  { clave: "sabritas", nombre: "Sabritas 45 g", categoria: "Botanas", unidad: "pieza", precioMenudeo: 19 },
  { clave: "bimbo", nombre: "Pan Bimbo grande", categoria: "Panadería", unidad: "pieza", precioMenudeo: 52 },
  { clave: "huevo", nombre: "Huevo (kg)", categoria: "Abarrotes", unidad: "kg", precioMenudeo: 48 },
  { clave: "aceite", nombre: "Aceite 1 L", categoria: "Abarrotes", unidad: "botella", precioMenudeo: 45 },
  { clave: "frijol", nombre: "Frijol 1 kg", categoria: "Abarrotes", unidad: "bolsa", precioMenudeo: 38 },
  { clave: "arroz", nombre: "Arroz 1 kg", categoria: "Abarrotes", unidad: "bolsa", precioMenudeo: 32 },
  { clave: "maseca", nombre: "Maseca 1 kg", categoria: "Abarrotes", unidad: "bolsa", precioMenudeo: 24 },
  { clave: "leche", nombre: "Leche 1 L", categoria: "Lácteos", unidad: "pieza", precioMenudeo: 29 },
  { clave: "papel", nombre: "Papel higiénico 4 pzas", categoria: "Limpieza", unidad: "paquete", precioMenudeo: 36 },
] as const;

type ClaveProducto = (typeof PRODUCTOS)[number]["clave"];

// stock / stockMinimo por tienda. Los marcados en rojo (stock ≤ mínimo) son a propósito.
const TIENDAS = [
  {
    clave: "lupe",
    email: "lupe@lavaquita.local",
    encargado: "Guadalupe Hernández",
    nombre: "Abarrotes Doña Lupe",
    direccion: "Av. Ventura Puente 120, Chapultepec Norte",
    dLat: 0.0012,
    dLng: -0.001,
    estatus: "APROBADA" as const,
    stock: { coca: [4, 6], sabritas: [3, 5], leche: [12, 6] } as Partial<Record<ClaveProducto, [number, number]>>,
  },
  {
    clave: "guero",
    email: "guero@lavaquita.local",
    encargado: "Ramón Díaz",
    nombre: "Miscelánea El Güero",
    direccion: "Calle Juan de Dios Peza 45, Chapultepec Norte",
    dLat: -0.0008,
    dLng: 0.0011,
    estatus: "APROBADA" as const,
    stock: { huevo: [2, 4], bimbo: [2, 3], maseca: [30, 5] } as Partial<Record<ClaveProducto, [number, number]>>,
  },
  {
    clave: "esperanza",
    email: "esperanza@lavaquita.local",
    encargado: "Esperanza Torres",
    nombre: "Tienda La Esperanza",
    direccion: "Calle Isidro Huarte 210, Chapultepec Norte",
    dLat: 0.0005,
    dLng: 0.0016,
    estatus: "APROBADA" as const,
    stock: { aceite: [1, 3], papel: [2, 4], coca: [8, 6] } as Partial<Record<ClaveProducto, [number, number]>>,
  },
  {
    clave: "tienda4",
    email: "tienda4@lavaquita.local",
    encargado: "Jurado HackaPony",
    nombre: "Tienda #4",
    direccion: "Calle de prueba 4, Chapultepec Norte",
    dLat: -0.0014,
    dLng: -0.0006,
    estatus: "APROBADA" as const,
    stock: {} as Partial<Record<ClaveProducto, [number, number]>>,
  },
  {
    clave: "sanjuan",
    email: "sanjuan@lavaquita.local",
    encargado: "Juan Martínez",
    nombre: "Abarrotes San Juan",
    direccion: "Calle Batalla de Casa Mata 33, Chapultepec Norte",
    dLat: 0.0018,
    dLng: 0.0003,
    estatus: "PENDIENTE" as const, // se aprueba en vivo en la demo
    stock: {} as Partial<Record<ClaveProducto, [number, number]>>,
  },
];

async function crearUsuario(email: string, nombre: string, password: string, role: "TENDERO" | "ADMIN") {
  const id = randomUUID();
  await db.user.create({
    data: {
      id,
      email,
      name: nombre,
      emailVerified: true,
      role,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: id,
          providerId: "credential",
          password: await hashPassword(password),
        },
      },
    },
  });
  return id;
}

async function imagenDemo(texto: string, color: string): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
    <rect width="100%" height="100%" fill="${color}"/>
    <text x="50%" y="45%" font-size="48" text-anchor="middle" fill="#fff" font-family="sans-serif">${texto}</text>
    <text x="50%" y="60%" font-size="28" text-anchor="middle" fill="#fff" font-family="sans-serif">DOCUMENTO DE DEMO · NO VÁLIDO</text>
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toBuffer();
}

async function main() {
  exigirContrasena("ADMIN_PASSWORD", ADMIN_PASSWORD);
  exigirContrasena("SEED_DEMO_PASSWORD", DEMO_PASSWORD);

  console.log("🧹 Limpiando datos…");
  await db.aportacion.deleteMany();
  await db.canasta.deleteMany();
  await db.movimiento.deleteMany();
  await db.inventario.deleteMany();
  await db.producto.deleteMany();
  await db.documentoTienda.deleteMany();
  await db.tienda.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.verification.deleteMany();
  await db.user.deleteMany();
  await db.auditLog.deleteMany();
  await db.rateLimit.deleteMany();
  await db.limiteIntentos.deleteMany();

  console.log("👤 Admin…");
  await crearUsuario(ADMIN_EMAIL, "Administración La Vaquita", ADMIN_PASSWORD, "ADMIN");

  console.log("📦 Productos…");
  const productos = {} as Record<ClaveProducto, { id: string; precioMenudeo: number }>;
  for (const p of PRODUCTOS) {
    const creado = await db.producto.create({
      data: { nombre: p.nombre, categoria: p.categoria, unidad: p.unidad, precioMenudeo: p.precioMenudeo },
    });
    productos[p.clave] = { id: creado.id, precioMenudeo: p.precioMenudeo };
  }

  console.log("🏪 Tiendas, inventario y movimientos…");
  const tiendas = {} as Record<string, string>;
  for (const t of TIENDAS) {
    const usuarioId = await crearUsuario(t.email, t.encargado, DEMO_PASSWORD, "TENDERO");
    const tienda = await db.tienda.create({
      data: {
        usuarioId,
        nombre: t.nombre,
        encargado: t.encargado,
        telefono: "4430000000",
        direccion: t.direccion,
        lat: CENTRO.lat + t.dLat,
        lng: CENTRO.lng + t.dLng,
        estatusVerificacion: t.estatus,
        revisadaEn: t.estatus === "APROBADA" ? haceDias(10) : null,
      },
    });
    tiendas[t.clave] = tienda.id;

    if (t.estatus !== "APROBADA") continue;

    for (const p of PRODUCTOS) {
      const [stock, stockMinimo] = t.stock[p.clave] ?? [15 + Math.floor(Math.random() * 20), 5];
      const inv = await db.inventario.create({
        data: { tiendaId: tienda.id, productoId: productos[p.clave].id, stock, stockMinimo },
      });
      // SALIDAS de los últimos 7 días para la predicción [RN-07]
      await db.movimiento.createMany({
        data: Array.from({ length: 7 }, (_, i) => ({
          inventarioId: inv.id,
          tipo: "SALIDA" as const,
          cantidad: 1 + Math.floor(Math.random() * 4),
          fecha: haceDias(i + 1),
        })),
      });
    }
  }

  console.log("🪪 Documentos de la tienda pendiente…");
  const docs: Array<[TipoDocumento, string, string]> = [
    ["FACHADA", "FACHADA · Abarrotes San Juan", "#7c3aed"],
    ["COMPROBANTE_DOMICILIO", "COMPROBANTE DE DOMICILIO", "#0e7490"],
    ["IDENTIFICACION", "INE · Juan Martínez", "#b45309"],
  ];
  for (const [tipo, texto, color] of docs) {
    const buffer = await imagenDemo(texto, color);
    const { contenido, iv, authTag } = cifrar(buffer);
    await db.documentoTienda.create({
      data: {
        tiendaId: tiendas.sanjuan,
        tipo,
        mimeType: "image/jpeg",
        tamano: buffer.length,
        sha256: sha256(buffer),
        iv: new Uint8Array(iv),
        authTag: new Uint8Array(authTag),
        contenido: new Uint8Array(contenido),
      },
    });
  }

  console.log("🐄 Vaquitas…");
  const coca = await db.canasta.create({
    data: {
      productoId: productos.coca.id,
      proveedor: "Central de Abastos Morelia",
      metaUnidades: 100,
      precioMayoreo: 14.5,
      cierraEn: new Date(Date.now() + 2 * DIA),
      estado: "ABIERTA",
    },
  });
  await db.aportacion.createMany({
    data: [
      { canastaId: coca.id, tiendaId: tiendas.guero, cantidad: 40 },
      { canastaId: coca.id, tiendaId: tiendas.esperanza, cantidad: 30 },
    ],
  });

  const maseca = await db.canasta.create({
    data: {
      productoId: productos.maseca.id,
      proveedor: "Distribuidora Michoacana",
      metaUnidades: 50,
      precioMayoreo: 19,
      cierraEn: haceDias(1),
      estado: "COMPLETA",
    },
  });
  await db.aportacion.createMany({
    data: [
      { canastaId: maseca.id, tiendaId: tiendas.lupe, cantidad: 20 },
      { canastaId: maseca.id, tiendaId: tiendas.guero, cantidad: 15 },
      { canastaId: maseca.id, tiendaId: tiendas.esperanza, cantidad: 15 },
    ],
  });

  console.log(`
✅ Seed listo
   Admin:      ${ADMIN_EMAIL}
   Tiendas:    ${TIENDAS.map((t) => t.email).join(", ")}
   (contraseña de tiendas = SEED_DEMO_PASSWORD; sanjuan está PENDIENTE para aprobarla en vivo)
   Correos:    http://localhost:8025 (Mailpit)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
