// Pantallas sin sesión (login, registro, recuperar…). Diseño: Sebastían.
export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center p-4">{children}</main>;
}
