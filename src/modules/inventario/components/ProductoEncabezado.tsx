import Image from "next/image";
import { AlertCircle, Check, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CardDescription, CardTitle } from "@/components/ui/card";
import type { ItemInventarioDTO } from "../types";

export function ProductoEncabezado({ item }: { item: ItemInventarioDTO }) {
  const estado = {
    critico: { texto: "Urge surtir", variante: "critical", Icono: AlertCircle },
    bajo: { texto: "Pendiente", variante: "warning", Icono: AlertCircle },
    ok: { texto: "Bien surtido", variante: "success", Icono: Check },
  } as const;
  const { texto, variante, Icono } = estado[item.nivel];

  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-accent-strong">
        {item.imagen ? <Image src={item.imagen} alt="" width={44} height={44} className="object-contain" unoptimized />
          : <Package aria-hidden="true" size={26} />}
      </div>
      <div className="flex min-w-0 flex-col items-start gap-2">
        <CardTitle><h2 className="text-lg leading-snug font-bold wrap-anywhere">{item.nombre}</h2></CardTitle>
        <CardDescription>{item.categoria} · {item.unidad}</CardDescription>
        <Badge variant={variante}><Icono aria-hidden="true" />{texto}</Badge>
      </div>
    </div>
  );
}
