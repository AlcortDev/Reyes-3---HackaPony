// Solo ADMIN [RNF-SEC-10]
import Link from "next/link";
import { BotonReiniciarDemo } from "@/modules/admin";
import { BotonSalir } from "@/modules/auth";
import { IconoVaquita, PapelPicado } from "@/shared/components";
import { requireAdmin } from "@/shared/security";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return (
    <>
      <header className="sticky top-0 z-40 bg-primary-oscuro pt-[env(safe-area-inset-top)] text-white shadow-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 lg:px-8">
          <Link href="/admin/tiendas" className="flex min-w-0 items-center gap-2.5">
            <IconoVaquita className="size-9 shrink-0" />
            <span className="truncate font-display text-xl font-bold">
              La Vaquita <span className="font-semibold text-white/70">· Admin</span>
            </span>
          </Link>
          <div className="flex items-center gap-1 [&_button]:text-white [&_button:hover]:bg-white/10 [&_button:hover]:text-white [&_button[data-variant=outline]]:border-white/30 [&_button[data-variant=outline]]:bg-transparent">
            <BotonReiniciarDemo />
            <BotonSalir />
          </div>
        </div>
        <PapelPicado alto={18} className="opacity-90" />
      </header>
      <main className="mx-auto max-w-6xl px-4 pt-6 pb-10 lg:px-8 lg:pt-10">{children}</main>
    </>
  );
}
