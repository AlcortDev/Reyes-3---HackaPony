"use client";
// [RF-AUT-06] Poner contraseña nueva con el token del correo (un solo uso, 15 min).
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/shared/auth-client";
import { restablecerSchema } from "../schemas";
import { Aviso } from "./Aviso";
import { CampoContrasena } from "./CampoContrasena";

export function RestablecerForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const enlaceInvalido = !token || params.get("error") !== null;
  const [errores, setErrores] = useState<{ password?: string; confirmar?: string; general?: string }>({});
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrores({});
    const form = new FormData(e.currentTarget);
    const datos = restablecerSchema.safeParse({ password: form.get("password"), confirmar: form.get("confirmar") });
    if (!datos.success) {
      const campo = datos.error.issues[0];
      setErrores({ [campo?.path[0] === "confirmar" ? "confirmar" : "password"]: campo?.message });
      return;
    }
    setCargando(true);
    const { error } = await authClient.resetPassword({ newPassword: datos.data.password, token: token! });
    setCargando(false);
    if (error) {
      setErrores({ general: "Este enlace ya no sirve. Pide uno nuevo." });
      return;
    }
    router.replace("/login?aviso=restablecida");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Pon tu contraseña nueva</CardTitle>
        <CardDescription className="text-base">Al cambiarla cerramos tus sesiones abiertas en otros aparatos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {enlaceInvalido ? (
          <>
            <Aviso tipo="error">Este enlace ya no sirve: se usó antes o pasaron más de 15 minutos.</Aviso>
            <Button asChild size="lg" className="w-full">
              <Link href="/recuperar">Pedir un enlace nuevo</Link>
            </Button>
          </>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <CampoContrasena
              id="password"
              name="password"
              etiqueta="Contraseña nueva"
              autoComplete="new-password"
              ayuda="Mínimo 12 caracteres. Tip: usa una frase, como «tienda de la esquina 2026»."
              error={errores.password}
            />
            <CampoContrasena
              id="confirmar"
              name="confirmar"
              etiqueta="Escríbela otra vez"
              autoComplete="new-password"
              error={errores.confirmar}
            />
            {errores.general && <Aviso tipo="error">{errores.general}</Aviso>}
            <Button type="submit" size="lg" className="w-full" disabled={cargando}>
              {cargando ? "Guardando…" : "Guardar contraseña"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
