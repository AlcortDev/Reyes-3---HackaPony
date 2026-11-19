// [RF-VER-05 · RNF-SEC-10] Capa 2 de 3: solo tiendas APROBADAS entran aquí (si no → /perfil).
// Celular: encabezado + barra inferior. PC (lg): menú lateral + contenido ancho.
import { HeaderTienda, MenuLateral } from "@/modules/tiendas";
import { Navbar } from "@/shared/components";
import { requireTiendaAprobada } from "@/shared/security";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { tienda } = await requireTiendaAprobada();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
      <MenuLateral nombre={tienda.nombre} />
      <div className="min-w-0">
        <HeaderTienda nombre={tienda.nombre} />
        <main className="mx-auto w-full max-w-md px-4 pt-5 pb-[calc(8rem+env(safe-area-inset-bottom))] lg:max-w-5xl lg:px-10 lg:pt-10 lg:pb-12">{children}</main>
      </div>
      <Navbar />
    </div>
  );
}
