"use client";
// [RF-DEM-02 · Plan B] Botón para reiniciar la demo entre ensayos. Servidor: reiniciarDemo (Hiram).
import { RefreshCcw } from "lucide-react";
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
import { reiniciarDemo } from "@/shared/demo";

export function BotonReiniciarDemo() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function reiniciar() {
    setCargando(true);
    try {
      const r = await reiniciarDemo();
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Demo reiniciada: inventario, vaquitas y tiendas como al inicio.");
      setAbierto(false);
      router.refresh();
    } catch {
      toast.error("No se pudo reiniciar la demo. Revisa que sigas con sesión de admin.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCcw className="size-5" aria-hidden />
          Reiniciar demo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Reiniciar la demo?</DialogTitle>
          <DialogDescription>
            Vuelve a cargar inventario, movimientos y vaquitas como en el seed, regresa “Abarrotes San Juan” a pendiente y
            quita los bloqueos por intentos. No borra cuentas, documentos ni la bitácora.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={reiniciar} disabled={cargando}>
            {cargando ? "Reiniciando…" : "Sí, reiniciar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
