"use client"

import { useEffect, useState, type ReactNode } from "react"

import { Icon } from "@/components/icone"
import { mensagemDoErro } from "@/http/api-crm"
import type {
  ChaveDaCategoria,
  ConsumoDeIa,
  PeriodoDoConsumo,
} from "@/http/crm/consumo-de-ia"
import { useConsumoDeIa } from "@/http/hooks/crm"
import {
  formatarData,
  formatarInteiro,
  formatarReais,
  formatarVariacao,
  hojeEmBrasilia,
  intervaloDoMesPassado,
} from "@/utils/consumo-de-ia"

import { GraficoPorDia } from "./grafico"

type Modo = "atual" | "passado" | "personalizado"

const MODOS: Array<{ valor: Modo; rotulo: string; titulo: string }> = [
  { valor: "atual", rotulo: "Mês atual", titulo: "Consumo de IA no mês" },
  {
    valor: "passado",
    rotulo: "Mês passado",
    titulo: "Consumo de IA no mês passado",
  },
  {
    valor: "personalizado",
    rotulo: "Personalizado",
    titulo: "Consumo de IA no período",
  },
]

const ICONES_DAS_CATEGORIAS: Record<ChaveDaCategoria, { icon: string }> = {
  atendimento: { icon: "mdi:whatsapp" },
  memoria: { icon: "mdi:brain" },
  busca: { icon: "mdi:file-search-outline" },
}

// Categoria que a API passe a mandar antes de a tela conhecê-la
const ICONE_GENERICO = { icon: "mdi:creation-outline" }

export function PainelDoConsumoDeIa() {
  const [modo, setModo] = useState<Modo>("atual")
  const [periodo, setPeriodo] = useState<PeriodoDoConsumo>({})

  const hoje = hojeEmBrasilia()
  const [rascunho, setRascunho] = useState({
    de: `${hoje.slice(0, 8)}01`,
    ate: hoje,
  })
  const [erroDoFormulario, setErroDoFormulario] = useState<string | null>(null)

  const { consumo, erro, isLoading } = useConsumoDeIa(periodo)
  const [mensagemDeErro, setMensagemDeErro] = useState<string | null>(null)

  useEffect(() => {
    if (!erro) {
      setMensagemDeErro(null)
      return
    }

    let vigente = true
    void mensagemDoErro(erro, "Não foi possível carregar o consumo de IA").then(
      (mensagem) => {
        if (vigente) setMensagemDeErro(mensagem)
      }
    )

    return () => {
      vigente = false
    }
  }, [erro])

  function escolher(novo: Modo): void {
    setModo(novo)
    setErroDoFormulario(null)

    if (novo === "atual") setPeriodo({})
    if (novo === "passado") setPeriodo(intervaloDoMesPassado(hoje))
    // Personalizado só consulta ao aplicar: buscar a cada data digitada
    // dispararia uma requisição por tecla, com intervalos pela metade.
  }

  function aplicar(): void {
    if (!rascunho.de || !rascunho.ate) {
      setErroDoFormulario("Informe as duas datas")
      return
    }

    if (rascunho.de > rascunho.ate) {
      setErroDoFormulario("A data inicial deve ser anterior à final")
      return
    }

    setErroDoFormulario(null)
    setPeriodo({ de: rascunho.de, ate: rascunho.ate })
  }

  const titulo = MODOS.find((m) => m.valor === modo)?.titulo

  return (
    <div className="w-full max-md:px-4 max-md:pt-4">
      <h1 className="text-lg font-semibold text-zinc-900">Consumo de IA</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Quanto a inteligência artificial do escritório foi usada e quanto isso
        representa em reais.
      </p>

      <section className="mt-5 rounded-2xl border border-[#ECECF1] bg-white p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[#24211E]">{titulo}</h2>
            {consumo && (
              <p className="mt-0.5 text-sm text-zinc-500">
                {formatarData(consumo.periodo.de)} a{" "}
                {formatarData(consumo.periodo.ate)}
              </p>
            )}
          </div>

          <div className="inline-flex max-w-full overflow-x-auto rounded-xl border border-[#ECECF1] bg-[#F7F8FA] p-1">
            {MODOS.map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                onClick={() => escolher(opcao.valor)}
                className={
                  modo === opcao.valor
                    ? "whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-[#2A727C] shadow-sm"
                    : "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 transition hover:text-[#24211E]"
                }
              >
                {opcao.rotulo}
              </button>
            ))}
          </div>
        </div>

        {modo === "personalizado" && (
          <form
            onSubmit={(evento) => {
              evento.preventDefault()
              aplicar()
            }}
            className="mt-4 flex flex-wrap items-end gap-3 rounded-xl bg-[#F7F8FA] p-3"
          >
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
              De
              <input
                type="date"
                value={rascunho.de}
                max={hoje}
                onChange={(evento) =>
                  setRascunho((r) => ({ ...r, de: evento.target.value }))
                }
                className="rounded-lg border border-[#ECECF1] bg-white px-3 py-2 text-sm text-[#24211E] outline-none focus:border-[#348C98]"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
              Até
              <input
                type="date"
                value={rascunho.ate}
                max={hoje}
                onChange={(evento) =>
                  setRascunho((r) => ({ ...r, ate: evento.target.value }))
                }
                className="rounded-lg border border-[#ECECF1] bg-white px-3 py-2 text-sm text-[#24211E] outline-none focus:border-[#348C98]"
              />
            </label>

            <button
              type="submit"
              className="rounded-lg bg-[#348C98] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2A727C]"
            >
              Aplicar
            </button>

            {erroDoFormulario && (
              <p className="w-full text-sm text-red-600">{erroDoFormulario}</p>
            )}
          </form>
        )}

        <div className="mt-5">
          {mensagemDeErro ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <Icon
                icon="mdi:alert-circle-outline"
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              {mensagemDeErro}
            </div>
          ) : isLoading || !consumo ? (
            <Esqueleto />
          ) : semConsumo(consumo) ? (
            <Vazio />
          ) : (
            <Conteudo consumo={consumo} />
          )}
        </div>

        <p className="mt-5 flex items-start gap-1.5 text-xs text-zinc-400">
          <Icon
            icon="mdi:information-outline"
            className="mt-px h-3.5 w-3.5 shrink-0"
          />
          Valores do consumo de inteligência artificial do escritório no
          período, já com os encargos da plataforma.
        </p>
      </section>
    </div>
  )
}

function semConsumo(consumo: ConsumoDeIa): boolean {
  return (
    consumo.total === 0 &&
    consumo.respostasDaIa === 0 &&
    consumo.categorias.every((c) => c.chamadas === 0)
  )
}

function Conteudo({ consumo }: { consumo: ConsumoDeIa }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador
          icon="mdi:cash-multiple"
          rotulo="Consumo no período"
          valor={formatarReais(consumo.total)}
        >
          <Variacao
            variacao={consumo.variacaoPercentual}
            anterior={consumo.totalAnterior}
          />
        </Indicador>

        <Indicador
          icon="mdi:forum-outline"
          rotulo="Conversas atendidas"
          valor={formatarInteiro(consumo.conversasAtendidas)}
        >
          <span className="text-xs text-zinc-400">com resposta da IA</span>
        </Indicador>

        <Indicador
          icon="mdi:robot-outline"
          rotulo="Respostas da IA"
          valor={formatarInteiro(consumo.respostasDaIa)}
        >
          <span className="text-xs text-zinc-400">enviadas aos contatos</span>
        </Indicador>

        <Indicador
          icon="mdi:calculator-variant-outline"
          rotulo="Valor médio por resposta"
          valor={formatarReais(consumo.valorMedioPorResposta)}
        >
          <span className="text-xs text-zinc-400">consumo ÷ respostas</span>
        </Indicador>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {consumo.categorias.map((categoria) => (
          <article
            key={categoria.chave}
            className="flex flex-col rounded-xl border border-[#ECECF1] bg-white p-4"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ECF7F8] text-[#348C98]">
                <Icon
                  icon={
                    (ICONES_DAS_CATEGORIAS[categoria.chave] ?? ICONE_GENERICO)
                      .icon
                  }
                  className="h-4 w-4"
                />
              </span>
              <h3 className="text-sm font-semibold text-[#24211E]">
                {categoria.rotulo}
              </h3>
            </div>

            <p className="mt-2 text-xs text-zinc-500">{categoria.descricao}</p>

            <div className="mt-auto pt-4">
              <div className="flex items-end justify-between gap-2">
                <span className="text-lg font-semibold text-[#24211E]">
                  {formatarReais(categoria.valor)}
                </span>
                <span className="text-sm font-medium text-[#2A727C]">
                  {categoria.percentual}%
                </span>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ECF7F8]">
                <div
                  className="h-full rounded-full bg-[#348C98]"
                  style={{
                    width: `${Math.min(100, Math.max(0, categoria.percentual))}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-zinc-400">
                {formatarInteiro(categoria.chamadas)}{" "}
                {categoria.chamadas === 1 ? "chamada" : "chamadas"}
              </p>
            </div>
          </article>
        ))}
      </div>

      <GraficoPorDia dias={consumo.porDia} />
    </div>
  )
}

function Indicador({
  icon,
  rotulo,
  valor,
  children,
}: {
  icon: string
  rotulo: string
  valor: string
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-[#ECECF1] bg-[#F7F8FA] p-3 md:p-4">
      <div className="flex items-start gap-2 text-xs font-medium text-zinc-500">
        <Icon icon={icon} className="h-4 w-4 shrink-0 text-[#348C98]" />
        <span className="leading-4">{rotulo}</span>
      </div>

      <span className="mt-2 truncate text-xl font-semibold text-[#24211E] md:text-2xl">
        {valor}
      </span>

      <div className="mt-1">{children}</div>
    </div>
  )
}

/**
 * Alta de consumo em âmbar, não em vermelho: gastar mais pode ser só mais
 * atendimento, e não um problema. Queda em verde.
 */
function Variacao({
  variacao,
  anterior,
}: {
  variacao: number | null
  anterior: number
}) {
  const texto = formatarVariacao(variacao)

  if (texto === null || variacao === null) {
    return (
      <span className="text-xs text-zinc-400">
        sem consumo no período anterior
      </span>
    )
  }

  const cor =
    variacao > 0
      ? "bg-amber-50 text-amber-700"
      : variacao < 0
        ? "bg-emerald-50 text-emerald-700"
        : "bg-zinc-100 text-zinc-600"

  return (
    <span
      className="flex flex-wrap items-center gap-1 text-xs text-zinc-400"
      title={`Período anterior: ${formatarReais(anterior)}`}
    >
      <span
        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium ${cor}`}
      >
        {variacao > 0 && (
          <Icon icon="mdi:trending-up" className="h-3.5 w-3.5" />
        )}
        {variacao < 0 && (
          <Icon icon="mdi:trending-down" className="h-3.5 w-3.5" />
        )}
        {texto}
      </span>
      vs. período anterior
    </span>
  )
}

function Vazio() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-[#ECECF1] bg-[#F7F8FA] px-4 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ECF7F8] text-[#348C98]">
        <Icon icon="mdi:robot-outline" className="h-6 w-6" />
      </span>
      <p className="mt-3 text-sm font-semibold text-[#24211E]">
        A IA ainda não foi usada neste período
      </p>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">
        Assim que ela responder contatos no WhatsApp, o consumo aparece aqui,
        dia a dia.
      </p>
    </div>
  )
}

function Esqueleto() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[104px] rounded-xl bg-[#F7F8FA]" />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 rounded-xl bg-[#F7F8FA]" />
        ))}
      </div>
      <div className="h-80 rounded-xl bg-[#F7F8FA]" />
    </div>
  )
}
