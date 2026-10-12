"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

import { Icon } from "@/components/icone"
import { Spinner } from "@/components/ui/sppiner"
import { useEtiquetas, useFunis, useQuadro } from "@/http/hooks/crm"

import { EtiquetaBadge } from "./etiqueta"
import { MetricasDoFunil } from "./metricas-do-funil"
import { QuadroDoFunil } from "./quadro"

/**
 * A visão de funil da tela de leads.
 *
 * Busca e etiquetas ficam na URL para que o filtro seja compartilhável; o
 * funil escolhido também, porque um escritório com dois funis abriria sempre
 * no padrão e a pessoa teria de trocar a cada visita.
 */
export function PainelDoFunil() {
  const parametros = useSearchParams()
  const busca = parametros.get("search") ?? ""

  const { funis, funilPadrao, isLoading: carregandoFunis } = useFunis()
  const { etiquetas } = useEtiquetas()

  const [funilEscolhido, setFunilEscolhido] = useState<string | null>(null)
  const [etiquetasAtivas, setEtiquetasAtivas] = useState<string[]>([])

  const pipelineId = funilEscolhido ?? funilPadrao?.id

  const filtros = useMemo(
    () => ({
      pipelineId,
      search: busca || undefined,
      tagIds: etiquetasAtivas,
      porEtapa: 20,
    }),
    [pipelineId, busca, etiquetasAtivas]
  )

  const { quadro, isLoading, mutate } = useQuadro(filtros)

  function alternarEtiqueta(id: string): void {
    setEtiquetasAtivas((atuais) =>
      atuais.includes(id)
        ? atuais.filter((atual) => atual !== id)
        : [...atuais, id]
    )
  }

  if (carregandoFunis) return <Spinner />

  return (
    <div className="mt-4">
      <MetricasDoFunil pipelineId={pipelineId} />

      <div className="mb-3 flex flex-wrap items-center gap-3">
        {funis.length > 1 && (
          <select
            value={pipelineId ?? ""}
            onChange={(evento) => setFunilEscolhido(evento.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-700 outline-none"
          >
            {funis.map((funil) => (
              <option key={funil.id} value={funil.id}>
                {funil.name}
              </option>
            ))}
          </select>
        )}

        {etiquetas.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {etiquetas.map((etiqueta) => {
              const ativa = etiquetasAtivas.includes(etiqueta.id)

              return (
                <button
                  key={etiqueta.id}
                  type="button"
                  onClick={() => alternarEtiqueta(etiqueta.id)}
                  aria-pressed={ativa}
                  className={`rounded-full transition ${
                    ativa
                      ? "ring-2 ring-zinc-900 ring-offset-1"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <EtiquetaBadge etiqueta={etiqueta} />
                </button>
              )
            })}

            {etiquetasAtivas.length > 0 && (
              <button
                type="button"
                onClick={() => setEtiquetasAtivas([])}
                className="text-xs text-zinc-500 underline"
              >
                limpar
              </button>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/lead/import"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-filete-forte bg-white px-3 text-[13px] font-medium text-tinta transition hover:bg-gray-100"
          >
            <Icon icon="mdi:file-upload-outline" className="h-4 w-4" />
            Importar
          </Link>

          <Link
            href="/setting/funil"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-filete-forte bg-white px-3 text-[13px] font-medium text-tinta transition hover:bg-gray-100"
          >
            <Icon icon="mdi:cog-outline" className="h-4 w-4" />
            Etapas
          </Link>
        </div>
      </div>

      {etiquetasAtivas.length > 1 && (
        // Vale dizer: o filtro é conjuntivo. Sem esse aviso, quem marca três
        // etiquetas e vê o quadro esvaziar acha que os leads sumiram.
        <p className="mb-2 text-xs text-zinc-500">
          Mostrando apenas leads que têm <strong>todas</strong> as etiquetas
          selecionadas.
        </p>
      )}

      <QuadroDoFunil
        quadro={quadro}
        isLoading={isLoading}
        recarregar={() => mutate()}
      />
    </div>
  )
}
