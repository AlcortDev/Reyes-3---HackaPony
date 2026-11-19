// Pantallas sin sesión (login, registro, recuperar…). Diseño: Sebastían.
// Celular: papel picado + logo + formulario. PC (lg): panel de marca a la izquierda, formulario a la derecha.
import { BellRing, PiggyBank } from "lucide-react";
import Link from "next/link";
import { IconoVaquita, IconoVaquitaLinea, Logo, PapelPicado } from "@/shared/components";

const BENEFICIOS = [
  { Icono: BellRing, titulo: "Tu inventario te avisa", texto: "Ves en rojo lo que se te está acabando, antes de que te lo pidan." },
  { Icono: IconoVaquitaLinea, titulo: "Hagan la vaquita", texto: "Junta tu pedido con las tiendas de tu colonia y llega a precio de mayoreo." },
  { Icono: PiggyBank, titulo: "El ahorro se queda en tu tienda", texto: "Cada vaquita completa te muestra cuánto dejaste de gastar." },
];

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Panel de marca (solo PC) */}
      <aside className="relative hidden flex-col overflow-hidden bg-primary-oscuro text-white lg:flex">
        <PapelPicado alto={40} />
        <div className="flex flex-1 flex-col justify-center gap-10 px-12 py-12 xl:px-16">
          <Link href="/login" aria-label="La Vaquita, inicio" className="w-fit">
            <Logo claro />
          </Link>
          <div className="space-y-4">
            <h2 className="max-w-md text-5xl leading-[1.05] font-extrabold">Juntos compramos a precio de mayoreo.</h2>
            <p className="max-w-md text-lg text-white/80">
              La app de las tienditas de la colonia: inventario rápido y compras en grupo, desde el celular.
            </p>
          </div>
          <ul className="max-w-md space-y-5">
            {BENEFICIOS.map(({ Icono, titulo, texto }) => (
              <li key={titulo} className="flex gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-accent">
                  <Icono className="size-6" />
                </span>
                <span>
                  <span className="block text-lg font-bold">{titulo}</span>
                  <span className="text-white/75">{texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        {/* vaquita grande de fondo, decorativa */}
        <IconoVaquita className="pointer-events-none absolute -right-16 -bottom-16 size-80 rotate-[-12deg] opacity-[0.07]" />
        <p className="px-12 pb-8 text-sm text-white/55 xl:px-16">Hecho en Morelia · HackaPony 2026</p>
      </aside>

      {/* Formulario */}
      <div className="flex min-h-dvh flex-col">
        <div className="lg:hidden">
          <PapelPicado alto={30} />
        </div>
        <header className="flex justify-center pt-6 pb-4 lg:hidden">
          <Link href="/login" aria-label="La Vaquita, inicio">
            <Logo />
          </Link>
        </header>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-10 lg:max-w-lg lg:px-8 lg:py-12">
          {children}
        </main>
        <footer className="pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-sm text-muted-foreground">
          <Link href="/privacidad" className="underline underline-offset-4">
            Aviso de privacidad
          </Link>
        </footer>
      </div>
    </div>
  );
}
