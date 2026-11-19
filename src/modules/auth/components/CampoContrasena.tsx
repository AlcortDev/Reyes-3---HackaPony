"use client";
// Input de contraseña con botón para mostrar/ocultar. Diseño: Sebastían.
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CampoContrasena({
  id,
  name,
  etiqueta,
  autoComplete,
  ayuda,
  error,
}: {
  id: string;
  name: string;
  etiqueta: string;
  autoComplete: "current-password" | "new-password";
  ayuda?: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  const idAyuda = `${id}-ayuda`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base">
        {etiqueta}
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          maxLength={128}
          aria-invalid={!!error}
          aria-describedby={ayuda || error ? idAyuda : undefined}
          className="pr-14"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
      {(error || ayuda) && (
        <p id={idAyuda} className={error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {error ?? ayuda}
        </p>
      )}
    </div>
  );
}
