import { Suspense } from "react";
import { VerificarCorreo } from "@/modules/auth";

// useSearchParams necesita Suspense en páginas estáticas
export default function Page() {
  return (
    <Suspense>
      <VerificarCorreo />
    </Suspense>
  );
}
