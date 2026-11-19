// Logo de La Vaquita (SVG propio). Diseño: Sebastían.
import { cn } from "@/lib/utils";

export function IconoVaquita({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-10", className)} aria-hidden="true">
      {/* cuernos */}
      <path d="M17 16c-5-1-8-5-8-9 4 2 8 3 11 6z" fill="#e9c46a" />
      <path d="M47 16c5-1 8-5 8-9-4 2-8 3-11 6z" fill="#e9c46a" />
      {/* orejas */}
      <ellipse cx="11" cy="25" rx="7" ry="4" fill="#ffffff" stroke="#1c2a1f" strokeWidth="2" transform="rotate(-20 11 25)" />
      <ellipse cx="53" cy="25" rx="7" ry="4" fill="#ffffff" stroke="#1c2a1f" strokeWidth="2" transform="rotate(20 53 25)" />
      {/* cabeza */}
      <path d="M16 22c0-7 7-11 16-11s16 4 16 11v14c0 9-7 17-16 17s-16-8-16-17z" fill="#ffffff" stroke="#1c2a1f" strokeWidth="2.5" />
      {/* manchas */}
      <path d="M20 17c4 0 8 3 7 8-1 4-6 4-9 2-2-1-2-8 2-10z" fill="#1c2a1f" />
      <circle cx="43" cy="20" r="3.5" fill="#1c2a1f" />
      {/* ojos */}
      <circle cx="25" cy="30" r="2.6" fill="#1c2a1f" />
      <circle cx="39" cy="30" r="2.6" fill="#1c2a1f" />
      {/* hocico */}
      <ellipse cx="32" cy="44" rx="12" ry="8.5" fill="#f4a6b4" stroke="#1c2a1f" strokeWidth="2.5" />
      <ellipse cx="27.5" cy="44" rx="2" ry="2.6" fill="#1c2a1f" />
      <ellipse cx="36.5" cy="44" rx="2" ry="2.6" fill="#1c2a1f" />
    </svg>
  );
}

export function Logo({ className, conTexto = true }: { className?: string; conTexto?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <IconoVaquita />
      {conTexto && (
        <span className="text-2xl font-extrabold tracking-tight text-secondary">
          La Vaquita
        </span>
      )}
    </span>
  );
}
