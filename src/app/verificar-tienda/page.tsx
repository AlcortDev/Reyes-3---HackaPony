// [RF-VER-01…04 · paso 2] Verificar la tienda, ya con sesión y correo confirmado.
import Link from "next/link";
import { redirect } from "next/navigation";
import { getMiTienda, VerificacionTienda } from "@/modules/tiendas";
import { BotonSalir } from "@/modules/auth";
import { Logo, PapelPicado } from "@/shared/components";
import { requireSession } from "@/shared/security";

export const metadata = { title: "Verifica tu tienda" };

export default async function VerificarTiendaPage() {
  const sesion = await requireSession();
  if (sesion.user.role === "ADMIN") redirect("/admin/tiendas");
  // Si ya la mandó (pendiente, aprobada, rechazada…), su estatus vive en el perfil
  if (await getMiTienda()) redirect("/perfil");

  return (
    <div className="min-h-dvh">
      <PapelPicado alto={30} />
      <header className="mx-auto flex max-w-xl items-center justify-between px-4 pt-6 pb-4">
        <Link href="/perfil" aria-label="Mi perfil">
          <Logo />
        </Link>
        <BotonSalir />
      </header>
      <main className="mx-auto max-w-xl px-4 pb-12">
        <VerificacionTienda nombre={sesion.user.name} />
      </main>
    </div>
  );
}
