"use client";
// [RF-TIE-04] Navegación de la app. Diseño: Sebastían.
// Celular: barra inferior con la vaquita al centro. PC: lista vertical para el menú lateral.
import { Package, PiggyBank } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { IconoVaquitaLinea } from "./Logo";

type Icono = React.ComponentType<{ className?: string }>;

export const SECCIONES: ReadonlyArray<{ href: string; texto: string; Icono: Icono; centro?: boolean }> = [
  { href: "/inventario", texto: "Inventario", Icono: Package },
  { href: "/vaquitas", texto: "Vaquitas", Icono: IconoVaquitaLinea, centro: true },
  { href: "/ahorro", texto: "Ahorro", Icono: PiggyBank },
];

function useActiva() {
  const ruta = usePathname();
  return (href: string) => ruta === href || ruta.startsWith(`${href}/`);
}

/** Barra inferior fija (solo celular y tablet). */
export function Navbar() {
  const activa = useActiva();
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_-12px_rgb(28_42_31/0.25)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-3 items-end">
        {SECCIONES.map(({ href, texto, Icono, centro }) => {
          const esActiva = activa(href);
          if (centro) {
            return (
              <li key={href} className="flex justify-center">
                <Link
                  href={href}
                  aria-current={esActiva ? "page" : undefined}
                  className="group -mt-6 flex flex-col items-center gap-1 pb-2 text-sm font-bold"
                >
                  <span
                    className={cn(
                      "grid size-16 place-items-center rounded-full border-4 border-background shadow-lg transition-transform group-active:scale-95",
                      esActiva ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground",
                    )}
                  >
                    <Icono className="size-8" />
                  </span>
                  <span className={esActiva ? "text-primary" : "text-muted-foreground"}>{texto}</span>
                </Link>
              </li>
            );
          }
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={esActiva ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-sm font-semibold transition-colors",
                  esActiva ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className={cn("grid h-8 w-14 place-items-center rounded-full transition-colors", esActiva && "bg-secondary")}>
                  <Icono className="size-6" />
                </span>
                {texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Lista vertical para el menú lateral de PC (sobre fondo verde). */
export function NavLateral() {
  const activa = useActiva();
  return (
    <nav aria-label="Secciones">
      <ul className="space-y-1.5">
        {SECCIONES.map(({ href, texto, Icono }) => {
          const esActiva = activa(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={esActiva ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-xl px-4 text-lg font-semibold transition-colors",
                  esActiva ? "bg-[#fbf8f1] text-primary shadow-sm" : "text-white/85 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icono className="size-6" />
                {texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
