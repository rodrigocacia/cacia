"use client"

import { Switch } from "@/components/ui/switch"

/**
 * Uma linha de aviso configurável: título, apoio, canais em etiquetas de
 * contorno e o interruptor à direita. As linhas se separam por filete.
 */
export function LinhaDeAviso({
  titulo,
  descricao,
  canais,
}: {
  titulo: string
  descricao: string
  canais: string[]
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-filete py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="text-[14px] font-semibold text-tinta">{titulo}</h3>
        <p className="text-[13.5px] text-tinta-2">{descricao}</p>

        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {canais.map((canal) => (
            <span
              key={canal}
              className="inline-flex h-[22px] items-center gap-1.5 rounded-md border border-[#E3DED6] bg-white px-2 text-xs font-medium text-tinta-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-acao" />
              {canal} habilitado
            </span>
          ))}
        </div>
      </div>

      <Switch aria-label={titulo} />
    </div>
  )
}
