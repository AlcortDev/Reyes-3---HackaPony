// Mensaje de estado accesible (error / éxito / info). Diseño: Sebastían.
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const ESTILOS = {
  error: { Icono: AlertCircle, clase: "border-destructive/30 bg-destructive/10 text-destructive", rol: "alert" as const },
  exito: { Icono: CheckCircle2, clase: "border-primary/30 bg-secondary text-secondary-foreground", rol: "status" as const },
  info: { Icono: Info, clase: "border-accent/30 bg-info-surface text-accent-strong", rol: "status" as const },
};

export function Aviso({ tipo, children }: { tipo: keyof typeof ESTILOS; children: React.ReactNode }) {
  const { Icono, clase, rol } = ESTILOS[tipo];
  return (
    <div role={rol} className={cn("flex items-start gap-3 rounded-lg border p-3 text-base", clase)}>
      <Icono className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
