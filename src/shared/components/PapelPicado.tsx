// Papel picado: hilera de banderitas recortadas. El único adorno de la marca (usar con medida).
// SVG con <pattern>: se repite sin deformarse a cualquier ancho.
import { useId } from "react";
import { cn } from "@/lib/utils";

const COLORES = ["#d6336c", "#fde68a", "#ffffff", "#6cc08b", "#f08c3a"];
const ANCHO = 36; // ancho de una banderita (px)

export function PapelPicado({ className, alto = 34 }: { className?: string; alto?: number }) {
  const id = useId().replace(/:/g, "");
  const grupo = ANCHO * COLORES.length;
  return (
    <svg className={cn("block w-full", className)} height={alto} aria-hidden="true" focusable="false">
      <defs>
        <pattern id={`pp-${id}`} width={grupo} height={alto} patternUnits="userSpaceOnUse">
          {COLORES.map((color, i) => {
            const x = i * ANCHO;
            const punta = alto - 4;
            return (
              <g key={color}>
                {/* banderita con borde inferior en pico */}
                <path
                  d={`M${x + 2} 3 H${x + ANCHO - 2} V${punta - 9} L${x + ANCHO / 2} ${punta} L${x + 2} ${punta - 9} Z`}
                  fill={color}
                  stroke="rgb(28 42 31 / 0.08)"
                />
                {/* recortes del papel picado */}
                <circle cx={x + ANCHO / 2} cy={11} r={3} fill="rgb(28 42 31 / 0.18)" />
                <path d={`M${x + 9} 18 l4 -4 l4 4 l-4 4 Z M${x + ANCHO - 17} 18 l4 -4 l4 4 l-4 4 Z`} fill="rgb(28 42 31 / 0.14)" />
              </g>
            );
          })}
        </pattern>
      </defs>
      {/* el cordel */}
      <line x1="0" y1="2" x2="100%" y2="2" stroke="rgb(28 42 31 / 0.35)" strokeWidth="1.5" />
      <rect width="100%" height={alto} fill={`url(#pp-${id})`} />
    </svg>
  );
}
