"use client";
// [RF-TIE-04] Navegación inferior fija tipo app. Diseño: Sebastían.
import { PiggyBank, Package, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECCIONES = [
  { href: "/inventario", texto: "Inventario", Icono: Package },
  { href: "/vaquitas", texto: "Vaquitas", Icono: Users },
  { href: "/ahorro", texto: "Ahorro", Icono: PiggyBank },
] as const;

export function Navbar() {
  const ruta = usePathname();
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {SECCIONES.map(({ href, texto, Icono }) => {
          const activa = ruta.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={activa ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-0.5 text-sm font-semibold transition-colors",
                  activa ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    activa && "bg-secondary",
                  )}
                >
                  <Icono className="size-6" aria-hidden />
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
