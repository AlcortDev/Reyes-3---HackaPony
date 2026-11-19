"use client";

// [RF-VAQ-06 · RNF-02, RNF-05] Selector compartido por producto y tiempo de cierre.
import { Check, ChevronDown } from "lucide-react";
import { Select } from "radix-ui";

export interface OpcionSelectorVaquita {
  valor: string;
  texto: string;
  detalle?: string;
  aviso?: string;
  deshabilitada?: boolean;
}

export function SelectorVaquita({
  id,
  value,
  onValueChange,
  etiqueta,
  opciones,
  placeholder = "Elige una opción",
}: {
  id: string;
  value: string;
  onValueChange: (valor: string) => void;
  etiqueta: string;
  opciones: readonly OpcionSelectorVaquita[];
  placeholder?: string;
}) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        id={id}
        className="mt-1 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border-0 bg-card px-3 py-2 text-left text-base font-bold text-primary-oscuro outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="min-w-0 flex-1 truncate">
          <Select.Value placeholder={placeholder} />
        </span>
        <Select.Icon asChild>
          <ChevronDown className="size-5 shrink-0" aria-hidden />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 max-h-[min(22rem,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl bg-card text-card-foreground shadow-lg outline-none"
        >
          <Select.Viewport className="p-1">
            <Select.Group>
              <Select.Label className="sr-only">{etiqueta}</Select.Label>
              {opciones.map((opcion) => (
                <Select.Item
                  key={opcion.valor}
                  value={opcion.valor}
                  textValue={opcion.texto}
                  disabled={opcion.deshabilitada}
                  className="group relative flex min-h-14 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-base outline-none data-[state=checked]:bg-surface-highlight data-[highlighted]:bg-muted data-[disabled]:cursor-not-allowed data-[disabled]:bg-muted"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <Select.ItemText>
                      <span className="break-words font-bold text-primary-oscuro group-data-[disabled]:text-muted-foreground">
                        {opcion.texto}
                      </span>
                    </Select.ItemText>
                    {opcion.detalle && (
                      <span className="break-words text-muted-foreground">{opcion.detalle}</span>
                    )}
                    {opcion.aviso && (
                      <span className="font-semibold text-muted-foreground">{opcion.aviso}</span>
                    )}
                  </span>
                  <Select.ItemIndicator className="shrink-0 text-secondary">
                    <Check className="size-5" aria-hidden />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Group>
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
