"use client";
// Campo para subir un documento con vista previa. Diseño: Sebastían.
// La validación real (tipo por bytes, tamaño, limpieza) la hace el servidor [RNF-SEC-08]; aquí solo ayudamos al usuario.
import { Camera, FileText, RefreshCw, Upload } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const MAX_MB = 5;

export function SubirDocumento({
  name,
  titulo,
  descripcion,
  soloImagen = false,
  camara = false,
  error,
  onValidez,
}: {
  name: string;
  titulo: string;
  descripcion: string;
  soloImagen?: boolean;
  /** En celular abre la cámara trasera directamente (fachada). */
  camara?: boolean;
  error?: string;
  onValidez?: (ok: boolean) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vista, setVista] = useState<string | null>(null);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => () => {
    if (vista) URL.revokeObjectURL(vista);
  }, [vista]);

  function alCambiar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setErrorLocal(null);
    if (vista) URL.revokeObjectURL(vista);
    setVista(null);
    setArchivo(f);
    if (!f) {
      onValidez?.(false);
      return;
    }
    const esImagen = f.type.startsWith("image/");
    const esPdf = f.type === "application/pdf";
    if (!esImagen && !(esPdf && !soloImagen)) {
      setErrorLocal(soloImagen ? "Sube una foto (JPG, PNG o WebP)." : "Sube una foto o un PDF.");
      onValidez?.(false);
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setErrorLocal(`El archivo pesa más de ${MAX_MB} MB. Toma la foto con menos calidad o usa otro archivo.`);
      onValidez?.(false);
      return;
    }
    if (esImagen) setVista(URL.createObjectURL(f));
    onValidez?.(true);
  }

  const mensaje = errorLocal ?? error;
  const Icono = camara ? Camera : Upload;

  return (
    <div className="space-y-2">
      <p className="text-base font-semibold" id={`${id}-titulo`}>
        {titulo}
      </p>
      <p className="text-sm text-muted-foreground">{descripcion}</p>

      <label
        htmlFor={id}
        className={cn(
          "flex min-h-28 cursor-pointer items-center gap-4 rounded-lg border-2 border-dashed bg-card p-4 transition-colors hover:border-primary",
          mensaje ? "border-destructive" : archivo ? "border-primary bg-secondary/50" : "border-input",
        )}
      >
        {vista ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:)
          <img src={vista} alt="" className="size-20 shrink-0 rounded-md object-cover" />
        ) : archivo ? (
          <FileText className="size-12 shrink-0 text-primary" aria-hidden />
        ) : (
          <Icono className="size-10 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <span className="min-w-0 flex-1">
          {archivo ? (
            <>
              <span className="block truncate font-semibold">{archivo.name}</span>
              <span className="flex items-center gap-1 text-sm text-primary">
                <RefreshCw className="size-4" aria-hidden /> Toca para cambiarlo
              </span>
            </>
          ) : (
            <span className="font-semibold text-primary">{camara ? "Tomar foto o elegir archivo" : "Elegir archivo"}</span>
          )}
        </span>
      </label>
      <input
        ref={input}
        id={id}
        name={name}
        type="file"
        required
        className="sr-only"
        accept={soloImagen ? "image/jpeg,image/png,image/webp" : "image/jpeg,image/png,image/webp,application/pdf"}
        {...(camara ? { capture: "environment" as const } : {})}
        aria-labelledby={`${id}-titulo`}
        aria-invalid={!!mensaje}
        onChange={alCambiar}
      />
      {mensaje && <p className="text-sm text-destructive">{mensaje}</p>}
    </div>
  );
}
