import { Suspense } from "react";
import { LoginForm } from "@/modules/auth";

// useSearchParams necesita Suspense en páginas estáticas
export default function Page() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
