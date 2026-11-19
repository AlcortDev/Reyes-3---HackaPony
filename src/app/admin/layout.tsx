// Solo ADMIN [RNF-SEC-10]
import { BotonSalir } from "@/modules/auth";
import { requireAdmin } from "@/shared/security";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return (
    <>
      <header className="flex items-center justify-between border-b bg-white px-4 py-2">
        <span className="font-bold">🛠️ Administración</span>
        <BotonSalir />
      </header>
      <main className="mx-auto max-w-3xl p-4">{children}</main>
    </>
  );
}
