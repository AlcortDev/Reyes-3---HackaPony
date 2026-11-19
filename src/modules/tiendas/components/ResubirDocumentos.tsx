"use client";
// [RF-VER-07] Volver a subir los 3 documentos cuando la tienda fue RECHAZADA. Servidor: resubirDocumentos (Hiram).
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Aviso } from "@/modules/auth";
import { resubirDocumentos } from "../actions";
import { CAMPOS_DOCUMENTO } from "../schemas";
import { SubirDocumento } from "./SubirDocumento";

export function ResubirDocumentos() {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [docsOk, setDocsOk] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const completos = Object.values(CAMPOS_DOCUMENTO).every((c) => docsOk[c]);
  const marcar = (c: string) => (ok: boolean) => setDocsOk((p) => ({ ...p, [c]: ok }));

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!completos) {
      setError("Sube los 3 documentos para enviarlos de nuevo.");
      return;
    }
    setError(null);
    setEnviando(true);
    const r = await resubirDocumentos(new FormData(form.current!));
    setEnviando(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    toast.success("¡Listo! Mandamos tus documentos a revisión.");
    router.refresh();
  }

  return (
    <form ref={form} onSubmit={enviar} noValidate className="space-y-6 rounded-lg border bg-card p-4">
      <h2 className="text-xl font-bold">Vuelve a subir tus documentos</h2>
      <SubirDocumento
        name={CAMPOS_DOCUMENTO.FACHADA}
        titulo="📸 Foto de la fachada"
        descripcion="Que se vea la entrada y, si tienes, el letrero."
        soloImagen
        camara
        onValidez={marcar(CAMPOS_DOCUMENTO.FACHADA)}
      />
      <SubirDocumento
        name={CAMPOS_DOCUMENTO.COMPROBANTE_DOMICILIO}
        titulo="🧾 Comprobante de domicilio"
        descripcion="Recibo de luz, agua o predial de los últimos 3 meses."
        onValidez={marcar(CAMPOS_DOCUMENTO.COMPROBANTE_DOMICILIO)}
      />
      <SubirDocumento
        name={CAMPOS_DOCUMENTO.IDENTIFICACION}
        titulo="🪪 Identificación oficial (INE)"
        descripcion="Del dueño de la tienda, por el frente."
        onValidez={marcar(CAMPOS_DOCUMENTO.IDENTIFICACION)}
      />
      {error && <Aviso tipo="error">{error}</Aviso>}
      <Button type="submit" size="lg" className="w-full" disabled={enviando}>
        {enviando ? "Enviando…" : "Mandar a revisión"}
      </Button>
    </form>
  );
}
