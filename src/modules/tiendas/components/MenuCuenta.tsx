"use client";

// [RF-TIE-01 · RF-AUT-03] Acceso al perfil y cierre de sesión desde el encabezado móvil.
import { Menu, UserRound, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BotonSalir } from "@/modules/auth";

export function MenuCuenta({ nombre }: { nombre: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" className="text-secondary hover:bg-muted hover:text-secondary" aria-label="Abrir menú de cuenta">
          <Menu className="size-6" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="inset-y-0 right-0 left-auto z-[60] flex h-dvh w-[calc(100%-2rem)] max-w-80 translate-x-0 translate-y-0 flex-col gap-0 rounded-none rounded-l-3xl border-y-0 border-r-0 p-0 sm:max-w-80"
      >
        <div className="flex items-start justify-between gap-3 border-b p-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <div className="min-w-0 space-y-2">
            <DialogTitle className="font-display text-2xl font-bold text-secondary">Menú</DialogTitle>
            <DialogDescription className="break-words text-base">{nombre}</DialogDescription>
          </div>
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="icon-sm" className="hover:bg-muted hover:text-foreground" aria-label="Cerrar menú">
              <X className="size-6" aria-hidden />
            </Button>
          </DialogClose>
        </div>

        <nav aria-label="Cuenta" className="overflow-y-auto p-4">
          <DialogClose asChild>
            <Link href="/perfil" className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-base font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
              <UserRound className="size-6 text-secondary" aria-hidden />
              Mi cuenta
            </Link>
          </DialogClose>
        </nav>

        <div className="mt-auto border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] [&_button]:w-full [&_button]:justify-start [&_button]:rounded-xl [&_button]:text-base [&_button:hover]:bg-muted [&_button:hover]:text-foreground">
          <BotonSalir />
        </div>
      </DialogContent>
    </Dialog>
  );
}
