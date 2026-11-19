// [RF-TIE-01, RF-TIE-04] Navegación compartida por los módulos y Mi cuenta.
// El acceso se valida en la página o layout que utiliza esta estructura.
import type { ReactNode } from "react";
import { Navbar } from "@/shared/components";
import { HeaderTienda, MenuLateral } from "./HeaderTienda";

export function EstructuraTienda({ nombre, children }: { nombre: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
      <MenuLateral nombre={nombre} />
      <div className="min-w-0">
        <HeaderTienda nombre={nombre} />
        <main className="mx-auto w-full max-w-md px-4 pt-5 pb-[calc(8rem+env(safe-area-inset-bottom))] lg:max-w-5xl lg:px-10 lg:pt-10 lg:pb-12">
          {children}
        </main>
      </div>
      <Navbar />
    </div>
  );
}
