// Requerido por shadcn/ui (alias "utils" en components.json). Las utilidades propias van en src/shared/utils.ts.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
