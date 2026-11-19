// Pantallas sin sesión (login, registro, recuperar…). Diseño: Sebastían.
import Link from "next/link";
import { Logo } from "@/shared/components";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex justify-center pt-8 pb-4">
        <Link href="/login" aria-label="La Vaquita, inicio">
          <Logo />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-10">{children}</main>
      <footer className="pb-6 text-center text-sm text-muted-foreground">
        <Link href="/privacidad" className="underline underline-offset-4">
          Aviso de privacidad
        </Link>
      </footer>
    </div>
  );
}
