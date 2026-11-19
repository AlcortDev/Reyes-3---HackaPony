// [RF-VER-05 · RNF-SEC-10] Capa 2 de 3: solo tiendas APROBADAS entran aquí (si no → /perfil).
import { HeaderTienda } from "@/modules/tiendas";
import { Navbar } from "@/shared/components";
import { requireTiendaAprobada } from "@/shared/security";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { tienda } = await requireTiendaAprobada();
  return (
    <>
      <HeaderTienda nombre={tienda.nombre} />
      <main className="mx-auto max-w-md p-4 pb-24">{children}</main>
      <Navbar />
    </>
  );
}
