// [RF-VER-05 · RNF-SEC-10] Capa 2 de 3: solo tiendas APROBADAS entran aquí (si no → /perfil).
// Celular: encabezado + barra inferior. PC (lg): menú lateral + contenido ancho.
import { EstructuraTienda } from "@/modules/tiendas";
import { requireTiendaAprobada } from "@/shared/security";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { tienda } = await requireTiendaAprobada();
  return <EstructuraTienda nombre={tienda.nombre}>{children}</EstructuraTienda>;
}
