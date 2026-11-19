import { useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { Button } from "../../src/components/ui/button";
import { HeaderTienda, MenuLateral } from "../../src/modules/tiendas/components/HeaderTienda";
import { Navbar } from "../../src/shared/components/Navbar";
import { InventarioLista } from "../../src/modules/inventario/components/InventarioLista";
import { DetalleInventarioContenido } from "../../src/modules/inventario/components/DetalleInventarioContenido";
import { INVENTARIO_MOCK } from "../../src/modules/inventario/mocks";

function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function Mockup() {
  const ruta = useSyncExternalStore(subscribe, () => window.location.hash.slice(1) || "/inventario");
  const producto = INVENTARIO_MOCK.find(item => ruta === `/inventario/${item.id}`);
  return (
    <>
      <div className="bg-secondary px-4 py-2 text-center text-base text-secondary-foreground">Mockup · datos de ejemplo · sin movimientos reales</div>
      <div className="min-h-dvh lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
        <MenuLateral nombre="Tienda de ejemplo" />
        <div className="min-w-0">
          <HeaderTienda nombre="Tienda de ejemplo" />
          <main className="mx-auto w-full max-w-md px-4 pt-5 pb-[calc(8rem+env(safe-area-inset-bottom))] lg:max-w-5xl lg:px-10 lg:pt-10 lg:pb-12">
        {producto ? <DetalleInventarioContenido detalle={{ ...producto, movimientos: [], diasParaAgotarse: 2 }} vaquita={null} />
          : ruta === "/inventario" ? <InventarioLista items={INVENTARIO_MOCK} />
            : <div className="flex flex-col gap-4"><h1 className="text-2xl font-bold">Vista de diseño de inventario</h1>
              <p>Las otras pantallas se revisan en la aplicación. Este mockup no se conecta a la base de datos.</p>
              <Button onClick={() => { window.location.hash = "/inventario"; }}>Volver al inventario</Button>
            </div>}
          </main>
        </div>
        <Navbar />
      </div>
      <Toaster position="top-center" />
    </>
  );
}

createRoot(document.getElementById("mockup")!).render(<Mockup />);
