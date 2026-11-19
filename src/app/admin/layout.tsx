// Solo ADMIN [RNF-SEC-10]
import Link from "next/link";
import { BotonSalir } from "@/modules/auth";
import { Logo } from "@/shared/components";
import { requireAdmin } from "@/shared/security";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/admin/tiendas" className="flex items-center gap-2">
            <Logo conTexto={false} />
            <span className="text-lg font-bold">Administración</span>
          </Link>
          <BotonSalir />
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-4">{children}</main>
    </>
  );
}
