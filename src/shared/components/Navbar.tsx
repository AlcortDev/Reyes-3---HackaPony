"use client";
// [RF-TIE-04] Navegación inferior fija. Diseño: Sebastían.
import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONES = [
  { href: "/inventario", texto: "Inventario", icono: "📦" },
  { href: "/vaquitas", texto: "Vaquitas", icono: "🐄" },
  { href: "/ahorro", texto: "Ahorro", icono: "💰" },
] as const;

export function Navbar() {
  const ruta = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-white">
      <ul className="mx-auto flex max-w-md justify-around">
        {SECCIONES.map((s) => {
          const activa = ruta.startsWith(s.href);
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                className={`flex min-h-14 min-w-20 flex-col items-center justify-center text-sm ${activa ? "font-bold text-green-700" : "text-gray-600"}`}
                aria-current={activa ? "page" : undefined}
              >
                <span className="text-2xl" aria-hidden>
                  {s.icono}
                </span>
                {s.texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
