"use client";
// [RF-VER-01 · paso 1] Crear la cuenta (nombre, correo, contraseña). La tienda se verifica después,
// ya con sesión, en /verificar-tienda. Diseño: Sebastían · servidor: registrarCuenta (Hiram).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Aviso, CampoContrasena } from "@/modules/auth";
import { registrarCuenta } from "../actions";
import { cuentaSchema } from "../schemas";

type Errores = Partial<Record<"nombre" | "email" | "password" | "confirmar", string>>;

export function RegistroCuenta() {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorGeneral(null);
    const fd = new FormData(form.current!);
    const datos = cuentaSchema.safeParse({ nombre: fd.get("nombre"), email: fd.get("email"), password: fd.get("password") });
    const nuevos: Errores = {};
    if (!datos.success) {
      for (const issue of datos.error.issues) nuevos[String(issue.path[0]) as keyof Errores] ??= issue.message;
    }
    if (fd.get("password") !== fd.get("confirmar")) nuevos.confirmar = "Las contraseñas no coinciden";
    setErrores(nuevos);
    if (Object.keys(nuevos).length || !datos.success) return;

    setEnviando(true);
    try {
      const r = await registrarCuenta(fd);
      if (!r.ok) {
        setErrorGeneral(r.error);
        return;
      }
      router.push(`/verificar-correo?email=${encodeURIComponent(datos.data.email)}`);
    } catch {
      setErrorGeneral("No pudimos crear tu cuenta. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Crea tu cuenta</CardTitle>
        <CardDescription className="text-base">
          Primero tu cuenta. Después, ya adentro, nos mandas los datos de tu tienda para verificarla.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={form} onSubmit={enviar} noValidate className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-base">Tu nombre</Label>
            <Input id="nombre" name="nombre" autoComplete="name" maxLength={80} aria-invalid={!!errores.nombre} />
            {errores.nombre && <p className="text-sm text-destructive">{errores.nombre}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base">Correo</Label>
            <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} aria-invalid={!!errores.email} />
            {errores.email && <p className="text-sm text-destructive">{errores.email}</p>}
          </div>
          <CampoContrasena
            id="password"
            name="password"
            etiqueta="Contraseña"
            autoComplete="new-password"
            ayuda="Mínimo 12 caracteres. Tip: usa una frase, como «tienda de la esquina 2026»."
            error={errores.password}
          />
          <CampoContrasena id="confirmar" name="confirmar" etiqueta="Escríbela otra vez" autoComplete="new-password" error={errores.confirmar} />
          {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
          <Button type="submit" size="lg" className="w-full" disabled={enviando}>
            {enviando ? "Creando tu cuenta…" : "Crear mi cuenta"}
          </Button>
          <p className="text-center">
            <Link href="/login" className="text-link underline underline-offset-4">
              Ya tengo cuenta
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
