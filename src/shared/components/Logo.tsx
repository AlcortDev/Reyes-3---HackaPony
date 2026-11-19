// Logo de La Vaquita (SVG propio). Diseño: Sebastían.
import { cn } from "@/lib/utils";

/** Vaquita a color (logo, splash, encabezados). */
export function IconoVaquita({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-10", className)} aria-hidden="true" focusable="false">
      {/* cuernos */}
      <path d="M17 16c-5-1-8-5-8-9 4 2 8 3 11 6z" fill="#e9c46a" stroke="#1c2a1f" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M47 16c5-1 8-5 8-9-4 2-8 3-11 6z" fill="#e9c46a" stroke="#1c2a1f" strokeWidth="1.5" strokeLinejoin="round" />
      {/* orejas */}
      <ellipse cx="11" cy="25" rx="7" ry="4" fill="#ffffff" stroke="#1c2a1f" strokeWidth="2" transform="rotate(-20 11 25)" />
      <ellipse cx="53" cy="25" rx="7" ry="4" fill="#ffffff" stroke="#1c2a1f" strokeWidth="2" transform="rotate(20 53 25)" />
      <ellipse cx="11.5" cy="25" rx="3.5" ry="1.8" fill="#f4a6b4" transform="rotate(-20 11.5 25)" />
      <ellipse cx="52.5" cy="25" rx="3.5" ry="1.8" fill="#f4a6b4" transform="rotate(20 52.5 25)" />
      {/* cabeza */}
      <path d="M16 22c0-7 7-11 16-11s16 4 16 11v14c0 9-7 17-16 17s-16-8-16-17z" fill="#ffffff" stroke="#1c2a1f" strokeWidth="2.5" />
      {/* manchas */}
      <path d="M20 17c4 0 8 3 7 8-1 4-6 4-9 2-2-1-2-8 2-10z" fill="#1c2a1f" />
      <circle cx="43" cy="20" r="3.5" fill="#1c2a1f" />
      {/* ojos con brillo */}
      <circle cx="25" cy="30" r="2.6" fill="#1c2a1f" />
      <circle cx="39" cy="30" r="2.6" fill="#1c2a1f" />
      <circle cx="25.9" cy="29.1" r="0.8" fill="#ffffff" />
      <circle cx="39.9" cy="29.1" r="0.8" fill="#ffffff" />
      {/* hocico */}
      <ellipse cx="32" cy="44" rx="12" ry="8.5" fill="#f4a6b4" stroke="#1c2a1f" strokeWidth="2.5" />
      <ellipse cx="27.5" cy="44" rx="2" ry="2.6" fill="#1c2a1f" />
      <ellipse cx="36.5" cy="44" rx="2" ry="2.6" fill="#1c2a1f" />
    </svg>
  );
}

/**
 * Vaquita de línea (un solo color, `currentColor`), del mismo trazo que los íconos de lucide.
 * Para navegación y botones: hereda el color del texto.
 */
export function IconoVaquitaLinea({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-6", className)}
      aria-hidden="true"
      focusable="false"
    >
      {/* cuernos */}
      <path d="M7 6.5C5.2 6.2 4 4.8 4 3.2c1.4.8 2.9 1.2 4.3 2.3" />
      <path d="M17 6.5c1.8-.3 3-1.7 3-3.3-1.4.8-2.9 1.2-4.3 2.3" />
      {/* orejas */}
      <path d="M6.6 9.2 3.4 8.6c-.9 1.6.3 3 2.9 2.6" />
      <path d="m17.4 9.2 3.2-.6c.9 1.6-.3 3-2.9 2.6" />
      {/* cabeza */}
      <path d="M6.5 9.5c0-2.6 2.5-4 5.5-4s5.5 1.4 5.5 4v4" />
      <path d="M6.5 9.5v4" />
      {/* hocico */}
      <rect x="6" y="13.2" width="12" height="7.3" rx="3.65" />
      <path d="M10 16.9h.01M14 16.9h.01" strokeWidth={strokeWidth + 0.6} />
      {/* ojos */}
      <path d="M9.6 10.4h.01M14.4 10.4h.01" strokeWidth={strokeWidth + 0.6} />
    </svg>
  );
}

export function Logo({ className, conTexto = true, claro = false }: { className?: string; conTexto?: boolean; claro?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <IconoVaquita />
      {conTexto && (
        <span className={cn("font-display text-[1.65rem] leading-none font-extrabold tracking-tight", claro ? "text-white" : "text-primary")}>
          La Vaquita
        </span>
      )}
    </span>
  );
}
