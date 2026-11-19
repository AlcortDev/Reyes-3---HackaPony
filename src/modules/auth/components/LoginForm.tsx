"use client";
// [RF-AUT-01] Formulario de inicio de sesión. Funcional; el diseño final es de Sebastían.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/shared/auth-client";
import { loginSchema } from "../schemas";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const datos = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
    if (!datos.success) {
      setError(datos.error.issues[0]?.message ?? "Revisa tus datos");
      return;
    }

    setCargando(true);
    const { error } = await authClient.signIn.email(datos.data);
    setCargando(false);

    if (error) {
      // Mensajes genéricos: no revelan si el correo existe [RNF-SEC-06]
      if (error.status === 403) setError("Confirma tu correo primero. Revisa tu bandeja de entrada.");
      else if (error.status === 429) setError("Demasiados intentos. Espera unos minutos.");
      else setError("Correo o contraseña incorrectos");
      return;
    }
    router.replace("/"); // la página raíz redirige según rol y estatus
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <h1 className="text-2xl font-bold">Entrar a La Vaquita 🐄</h1>
      <label className="block">
        <span className="text-base">Correo</span>
        <input name="email" type="email" autoComplete="email" required className="mt-1 w-full rounded-md border p-3 text-base" />
      </label>
      <label className="block">
        <span className="text-base">Contraseña</span>
        <input name="password" type="password" autoComplete="current-password" required className="mt-1 w-full rounded-md border p-3 text-base" />
      </label>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}
      <button type="submit" disabled={cargando} className="min-h-12 w-full rounded-md bg-green-700 font-semibold text-white disabled:opacity-60">
        {cargando ? "Entrando…" : "Entrar"}
      </button>
      <div className="flex justify-between text-sm">
        <Link href="/recuperar" className="underline">¿Olvidaste tu contraseña?</Link>
        <Link href="/registro" className="underline">Registrar mi tienda</Link>
      </div>
    </form>
  );
}
