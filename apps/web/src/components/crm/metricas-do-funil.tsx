"use client"

import { useMetricasDoFunil } from "@/http/hooks/crm"

import { duracao } from "./ficha/linha-do-tempo"
import { emReais } from "./quadro/cartao"

function Numero({
  rotulo,
  valor,
  detalhe,
  destaque,
}: {
  rotulo: string
  valor: string
  detalhe?: string
  destaque?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 border-filete px-5 py-4 not-last:border-r max-md:not-last:border-r-0 max-md:not-last:border-b">
      <p className="text-[12.5px] text-tinta-3">{rotulo}</p>
      <p
        className={`tabular truncate text-[26px] leading-none font-medium tracking-[-0.03em] ${
          destaque ? "text-turquesa-profundo" : "text-tinta"
        }`}
      >
        {valor}
      </p>
      {detalhe && <p className="text-xs text-tinta-3">{detalhe}</p>}
    </div>
  )
}

/**
 * Os números do funil na janela recente.
 *
 * A taxa é sobre o que FECHOU — ganhos sobre ganhos mais perdidos — e não
 * sobre tudo que entrou: um lead criado ontem ainda não teve chance de virar
 * cliente, e contá-lo no denominador faria a taxa cair sempre que a captação
 * aumentasse.
 */
export function MetricasDoFunil({
  pipelineId,
  dias = 30,
}: {
  pipelineId?: string
  dias?: number
}) {
  const { metricas, isLoading } = useMetricasDoFunil(pipelineId, dias)

  if (isLoading || !metricas) return null

  const { periodo, stages } = metricas

  // A etapa aberta em que os leads mais demoram — onde o funil está travando
  const gargalo = stages
    .filter((etapa) => etapa.kind === "OPEN" && etapa.tempoMedioSegundos > 0)
    .sort((a, b) => b.tempoMedioSegundos - a.tempoMedioSegundos)[0]

  const taxa =
    periodo.taxaConversao === null
      ? "—"
      : `${Math.round(periodo.taxaConversao * 100)}%`

  return (
    <div className="mb-5 grid rounded-[14px] border border-filete bg-white md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
      <Numero rotulo={`Novos em ${dias}d`} valor={String(periodo.criados)} />

      <Numero
        rotulo="Ganhos"
        valor={String(periodo.ganhos)}
        detalhe={emReais(periodo.valorGanho) ?? undefined}
        destaque
      />

      <Numero rotulo="Perdidos" valor={String(periodo.perdidos)} />

      <Numero
        rotulo="Conversão"
        valor={taxa}
        detalhe={
          periodo.taxaConversao === null
            ? "nada fechou ainda"
            : "sobre o que fechou"
        }
      />

      {gargalo && (
        <Numero
          rotulo="Mais demora em"
          valor={gargalo.name}
          detalhe={duracao(gargalo.tempoMedioSegundos) ?? undefined}
        />
      )}
    </div>
  )
}
