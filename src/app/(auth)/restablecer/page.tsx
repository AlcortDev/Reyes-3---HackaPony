import { Suspense } from "react";
import { RestablecerForm } from "@/modules/auth";

// useSearchParams necesita Suspense en páginas estáticas
export default function Page() {
  return (
    <Suspense>
      <RestablecerForm />
    </Suspense>
  );
}
