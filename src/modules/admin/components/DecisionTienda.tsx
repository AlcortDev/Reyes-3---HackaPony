"use client";
// [RF-VER-06, RF-VER-08 · RN-16] Botones de decisión del admin. Servidor: aprobarTienda / rechazarTienda / suspenderTienda (Hiram).
import { Ban, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EstatusVerificacion } from "@/shared/types";
import { aprobarTienda, rechazarTienda, suspenderTienda } from "../actions";

const MIN_MOTIVO = 5; // igual que motivoSchema

function DialogoMotivo({
  titulo,
  descripcion,
  textoBoton,
  variante,
  Icono,
  onConfirmar,
}: {
  titulo: string;
  descripcion: string;
  textoBoton: string;
  variante: "destructive" | "outline";
  Icono: typeof X;
  onConfirmar: (motivo: string) => Promise<boolean>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const valido = motivo.trim().length >= MIN_MOTIVO;

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant={variante} size="lg" className="flex-1">
          <Icono className="size-5" aria-hidden />
          {textoBoton}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="motivo" className="text-base">
            Motivo (lo verá el dueño de la tienda)
          </Label>
          <Textarea
            id="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Ej. La foto del comprobante no se lee. Sube una más clara."
          />
          <p className="text-sm text-muted-foreground">{motivo.trim().length}/500 · mínimo {MIN_MOTIVO} caracteres</p>
        </div>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={!valido || enviando}
            onClick={async () => {
              setEnviando(true);
              const ok = await onConfirmar(motivo.trim());
              setEnviando(false);
              if (ok) setAbierto(false);
            }}
          >
            {enviando ? "Guardando…" : textoBoton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DecisionTienda({ tiendaId, estatus }: { tiendaId: string; estatus: EstatusVerificacion }) {
  const router = useRouter();
  const [aprobando, setAprobando] = useState(false);

  async function resultado(r: { ok: true } | { ok: false; error: string }, exito: string) {
    if (!r.ok) {
      toast.error(r.error);
      return false;
    }
    toast.success(exito);
    router.push("/admin/tiendas");
    router.refresh();
    return true;
  }

  if (estatus === "PENDIENTE") {
    return (
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="flex-1"
          disabled={aprobando}
          onClick={async () => {
            setAprobando(true);
            await resultado(await aprobarTienda(tiendaId), "Tienda aprobada. Le avisamos por correo.");
            setAprobando(false);
          }}
        >
          <Check className="size-5" aria-hidden />
          {aprobando ? "Aprobando…" : "Aprobar tienda"}
        </Button>
        <DialogoMotivo
          titulo="Rechazar tienda"
          descripcion="El dueño verá el motivo en su perfil y podrá volver a subir sus documentos."
          textoBoton="Rechazar"
          variante="destructive"
          Icono={X}
          onConfirmar={async (motivo) => resultado(await rechazarTienda(tiendaId, motivo), "Tienda rechazada. Le avisamos por correo.")}
        />
      </div>
    );
  }

  if (estatus === "APROBADA") {
    return (
      <DialogoMotivo
        titulo="Suspender tienda"
        descripcion="La tienda dejará de poder usar La Vaquita hasta que la reactives."
        textoBoton="Suspender"
        variante="outline"
        Icono={Ban}
        onConfirmar={async (motivo) => resultado(await suspenderTienda(tiendaId, motivo), "Tienda suspendida.")}
      />
    );
  }

  return null;
}
