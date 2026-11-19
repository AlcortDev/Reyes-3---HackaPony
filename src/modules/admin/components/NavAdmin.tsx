"use client";
// Navegación del panel de admin. Diseño: Sebastían.
import { Store, Tag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECCIONES = [
  { href: "/admin/tiendas", texto: "Tiendas", Icono: Store },
  { href: "/admin/productos", texto: "Precios de mayoreo", Icono: Tag },
];

export function NavAdmin() {
  const ruta = usePathname();
  return (
    <nav aria-label="Administración" className="flex flex-wrap gap-2">
      {SECCIONES.map(({ href, texto, Icono }) => {
        const activa = ruta.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={activa ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-xl px-4 font-semibold transition-colors",
              activa ? "bg-primary text-primary-foreground shadow-sm" : "bg-card text-foreground hover:bg-muted",
            )}
          >
            <Icono className="size-5" aria-hidden />
            {texto}
          </Link>
        );
      })}
    </nav>
  );
}
