// [RF-TIE-01] Encabezado con el nombre de la tienda en sesión. Diseño: Sebastían.
import Link from "next/link";
import { BotonSalir } from "@/modules/auth";
import { IconoVaquita } from "@/shared/components";

export function HeaderTienda({ nombre }: { nombre: string }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between gap-2 px-4">
        <Link href="/perfil" className="flex min-w-0 items-center gap-2" aria-label={`Perfil de ${nombre}`}>
          <IconoVaquita className="size-9 shrink-0" />
          <span className="truncate text-lg font-bold">{nombre}</span>
        </Link>
        <BotonSalir />
      </div>
    </header>
  );
}
