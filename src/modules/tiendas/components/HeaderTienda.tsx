// [RF-TIE-01] Encabezado con el nombre de la tienda en sesión. Diseño: Sebastían.
import Link from "next/link";
import { BotonSalir } from "@/modules/auth";

export function HeaderTienda({ nombre }: { nombre: string }) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-white px-4 py-2">
      <Link href="/perfil" className="font-bold">🏪 {nombre}</Link>
      <BotonSalir />
    </header>
  );
}
