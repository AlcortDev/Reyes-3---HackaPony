// [RF-TIE-01] Encabezado (celular) y menú lateral (PC) con la tienda en sesión. Diseño: Sebastían.
import Link from "next/link";
import { BotonSalir } from "@/modules/auth";
import { IconoVaquita, Logo, NavLateral, PapelPicado } from "@/shared/components";
import { MenuCuenta } from "./MenuCuenta";

function Iniciales({ nombre }: { nombre: string }) {
  const letras = nombre
    .replace(/^(abarrotes|miscelánea|miscelanea|tienda)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent font-display text-lg font-extrabold text-accent-foreground">
      {letras || "🏪"}
    </span>
  );
}

/** Celular y tablet: barra superior. */
export function HeaderTienda({ nombre }: { nombre: string }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between gap-2 px-4">
        <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5">
          <IconoVaquita className="size-9 shrink-0" />
          <span className="truncate font-display text-xl font-bold">{nombre}</span>
        </div>
        <MenuCuenta nombre={nombre} />
      </div>
    </header>
  );
}

/** PC: menú lateral fijo con marca, tienda y secciones. */
export function MenuLateral({ nombre }: { nombre: string }) {
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col bg-primary-oscuro text-white lg:flex">
      <PapelPicado alto={30} />
      <div className="flex flex-1 flex-col gap-8 px-5 pt-6 pb-6">
        <Link href="/inventario" aria-label="La Vaquita, inicio">
          <Logo claro />
        </Link>

        <Link
          href="/perfil"
          className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 transition-colors hover:bg-white/15"
        >
          <Iniciales nombre={nombre} />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{nombre}</span>
            <span className="text-base text-white/70">Ver mi perfil</span>
          </span>
        </Link>

        <NavLateral />

        <div className="mt-auto space-y-4">
          <p className="rounded-xl border border-white/15 p-3 text-base text-white/75">
            Junta tu pedido con las tiendas de tu colonia y paga precio de mayoreo.
          </p>
          <div className="[&_button]:w-full [&_button]:justify-start [&_button]:text-white/85 [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
            <BotonSalir />
          </div>
        </div>
      </div>
    </aside>
  );
}
