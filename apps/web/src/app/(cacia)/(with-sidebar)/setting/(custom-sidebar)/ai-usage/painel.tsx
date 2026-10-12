"use client"

import { useEffect, useState, type ReactNode } from "react"

import {
  Bot,
  Brain,
  CircleAlert,
  FileSearch,
  Info,
  MessageCircle,
  Sparkles,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

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

import { Cartao } from "../../_ui/cartao"
import { GraficoPorDia } from "./grafico"

type Modo = "atual" | "passado" | "personalizado"

const MODOS: Array<{ valor: Modo; rotulo: string; titulo: string }> = [
  {
    valor: "atual",
    rotulo: "Mês atual",
    titulo: "Consumo do assistente no mês",
  },
  {
    valor: "passado",
    rotulo: "Mês passado",
    titulo: "Consumo do assistente no mês passado",
  },
  {
    valor: "personalizado",
    rotulo: "Personalizado",
    titulo: "Consumo do assistente no período",
  },
]

// Categoria que a API passe a mandar antes de a tela conhecê-la cai no
// ícone genérico (Sparkles), no ponto de uso.
const ICONES_DAS_CATEGORIAS: Record<ChaveDaCategoria, LucideIcon> = {
  atendimento: MessageCircle,
  memoria: Brain,
  busca: FileSearch,
}

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
    <Cartao
      titulo={titulo}
      descricao={
        consumo ? (
          <span className="tabular">
            {formatarData(consumo.periodo.de)} a{" "}
            {formatarData(consumo.periodo.ate)}
          </span>
        ) : (
          "Quanto o assistente do escritório foi usado e quanto isso representa em reais."
        )
      }
      acao={
        <div
          role="group"
          aria-label="Período do consumo"
          className="flex max-w-full gap-0.5 overflow-x-auto rounded-[9px] border border-filete bg-[#F1EEE8] p-[3px]"
        >
          {MODOS.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              aria-pressed={modo === opcao.valor}
              onClick={() => escolher(opcao.valor)}
              className={
                modo === opcao.valor
                  ? "h-7 cursor-pointer rounded-[7px] bg-white px-3 text-[12.5px] font-semibold whitespace-nowrap text-tinta shadow-[0_1px_2px_rgba(21,19,17,0.08)]"
                  : "h-7 cursor-pointer rounded-[7px] px-3 text-[12.5px] font-medium whitespace-nowrap text-tinta-3 transition-colors hover:text-tinta"
              }
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      }
    >
      {modo === "personalizado" && (
        <form
          onSubmit={(evento) => {
            evento.preventDefault()
            aplicar()
          }}
          className="mb-6 flex flex-wrap items-end gap-3 border-b border-filete pb-6"
        >
          <label className="flex flex-col gap-[7px] text-[13px] font-medium text-tinta-2">
            De
            <input
              type="date"
              value={rascunho.de}
              max={hoje}
              onChange={(evento) =>
                setRascunho((r) => ({ ...r, de: evento.target.value }))
              }
              className="h-11 rounded-[10px] border border-filete-forte bg-white px-3.5 text-[15px] text-tinta outline-none focus:border-acao focus:shadow-[0_0_0_3px_#D7EBEE]"
            />
          </label>

          <label className="flex flex-col gap-[7px] text-[13px] font-medium text-tinta-2">
            Até
            <input
              type="date"
              value={rascunho.ate}
              max={hoje}
              onChange={(evento) =>
                setRascunho((r) => ({ ...r, ate: evento.target.value }))
              }
              className="h-11 rounded-[10px] border border-filete-forte bg-white px-3.5 text-[15px] text-tinta outline-none focus:border-acao focus:shadow-[0_0_0_3px_#D7EBEE]"
            />
          </label>

          <button
            type="submit"
            className="h-11 cursor-pointer rounded-[10px] bg-acao px-4 text-[14px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:bg-acao-escura"
          >
            Aplicar
          </button>

          {erroDoFormulario && (
            <p className="w-full text-[13px] text-[#A23B2A]">
              {erroDoFormulario}
            </p>
          )}
        </form>
      )}

      {mensagemDeErro ? (
        <div className="flex items-start gap-2 rounded-[10px] bg-[#FBEDEA] px-4 py-3 text-[13.5px] text-[#A23B2A]">
          <CircleAlert
            size={16}
            strokeWidth={1.7}
            className="mt-0.5 shrink-0"
            aria-hidden
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

      <p className="mt-6 flex items-start gap-1.5 text-[12.5px] text-tinta-3">
        <Info
          size={14}
          strokeWidth={1.7}
          className="mt-px shrink-0"
          aria-hidden
        />
        Valores do consumo do assistente do escritório no período, já com os
        encargos da plataforma.
      </p>
    </Cartao>
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
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 overflow-hidden rounded-[12px] border border-filete lg:grid-cols-4">
        <Indicador
          rotulo="Consumo no período"
          valor={formatarReais(consumo.total)}
        >
          <Variacao
            variacao={consumo.variacaoPercentual}
            anterior={consumo.totalAnterior}
          />
        </Indicador>

        <Indicador
          rotulo="Conversas atendidas"
          valor={formatarInteiro(consumo.conversasAtendidas)}
        >
          <span className="text-xs text-tinta-3">
            com resposta do assistente
          </span>
        </Indicador>

        <Indicador
          rotulo="Respostas do assistente"
          valor={formatarInteiro(consumo.respostasDaIa)}
        >
          <span className="text-xs text-tinta-3">enviadas aos contatos</span>
        </Indicador>

        <Indicador
          rotulo="Valor médio por resposta"
          valor={formatarReais(consumo.valorMedioPorResposta)}
        >
          <span className="text-xs text-tinta-3">consumo ÷ respostas</span>
        </Indicador>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="rotulo">Por categoria</h3>

        <ul className="flex flex-col">
          {consumo.categorias.map((categoria) => {
            const Icone = ICONES_DAS_CATEGORIAS[categoria.chave] ?? Sparkles

            return (
              <li
                key={categoria.chave}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-t border-[#F1EEE8] py-3.5 last:border-b"
              >
                <Icone
                  size={16}
                  strokeWidth={1.7}
                  className="text-tinta-3"
                  aria-hidden
                />

                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-tinta">
                    {categoria.rotulo}
                  </p>
                  <p className="text-[12.5px] text-tinta-3">
                    {categoria.descricao}
                  </p>
                </div>

                <div className="flex flex-col items-end">
                  <span className="tabular text-[14px] font-semibold text-tinta">
                    {formatarReais(categoria.valor)}
                  </span>
                  <span className="tabular text-xs whitespace-nowrap text-tinta-3">
                    {categoria.percentual}% ·{" "}
                    {formatarInteiro(categoria.chamadas)}{" "}
                    {categoria.chamadas === 1 ? "chamada" : "chamadas"}
                  </span>
                </div>

                <div className="col-start-2 col-end-4 h-1 overflow-hidden rounded-full bg-[#F1EEE8]">
                  <div
                    className="h-full rounded-full bg-acao"
                    style={{
                      width: `${Math.min(100, Math.max(0, categoria.percentual))}%`,
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <GraficoPorDia dias={consumo.porDia} />
    </div>
  )
}

function Indicador({
  rotulo,
  valor,
  children,
}: {
  rotulo: string
  valor: string
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border-filete px-5 py-4 max-lg:odd:border-r max-lg:[&:nth-child(-n+2)]:border-b lg:not-last:border-r">
      <span className="text-[12.5px] text-tinta-3">{rotulo}</span>

      <span className="tabular truncate text-[26px] leading-none font-medium tracking-[-0.03em] text-tinta max-md:text-[21px]">
        {valor}
      </span>

      <div>{children}</div>
    </div>
  )
}

/**
 * Alta de consumo em âmbar, não em vermelho: gastar mais pode ser só mais
 * atendimento, e não um problema. Queda em turquesa.
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
      <span className="text-xs text-tinta-3">
        sem consumo no período anterior
      </span>
    )
  }

  const cor =
    variacao > 0
      ? "bg-ambar-fundo text-ambar"
      : variacao < 0
        ? "bg-nevoa text-turquesa-profundo"
        : "bg-[#F1EEE8] text-tinta-2"

  return (
    <span
      className="flex flex-wrap items-center gap-1 text-xs text-tinta-3"
      title={`Período anterior: ${formatarReais(anterior)}`}
    >
      <span
        className={`tabular inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium ${cor}`}
      >
        {variacao > 0 && <TrendingUp size={13} aria-hidden />}
        {variacao < 0 && <TrendingDown size={13} aria-hidden />}
        {texto}
      </span>
      vs. período anterior
    </span>
  )
}

function Vazio() {
  return (
    <div className="flex flex-col items-center rounded-[12px] border border-dashed border-filete-forte px-4 py-12 text-center">
      <Bot size={22} strokeWidth={1.7} className="text-tinta-3" aria-hidden />
      <p className="mt-3 text-[14px] font-semibold text-tinta">
        O assistente ainda não foi usado neste período
      </p>
      <p className="mt-1 max-w-sm text-[13px] text-tinta-3">
        Assim que ele responder contatos no WhatsApp, o consumo aparece aqui,
        dia a dia.
      </p>
    </div>
  )
}

function Esqueleto() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true">
      <div className="h-[104px] rounded-[12px] bg-[#F1EEE8]" />
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-[#F6F4EF]" />
        ))}
      </div>
      <div className="h-72 rounded-[12px] bg-[#F6F4EF]" />
    </div>
  )
}
