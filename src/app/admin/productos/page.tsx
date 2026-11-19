import { CatalogoPrecios, listarCatalogo } from "@/modules/admin";

export const metadata = { title: "Precios de mayoreo" };

export default async function AdminProductosPage() {
  // El layout de /admin ya exige rol ADMIN
  const productos = await listarCatalogo();
  return <CatalogoPrecios productos={productos} />;
}
