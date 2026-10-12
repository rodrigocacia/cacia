"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import clsx from "clsx"
import { ArrowRight, FileText, Sparkles } from "lucide-react"

import { Form as NovoLead } from "@/app/(cacia)/(with-sidebar)/lead/new/form"

import { buscarInicio, type JanelaDoInicio } from "@/http/crm/inicio"
import { useMe } from "@/http/hooks/user"

import {
  caminhoDaSerie,
  emReaisCompacto,
  espera,
  primeiroNome,
  resumoDoDia,
  saudacao,
  variacao,
} from "./textos"

const JANELAS: { valor: JanelaDoInicio; rotulo: string }[] = [
  { valor: "semana", rotulo: "Semana" },
  { valor: "mes", rotulo: "Mês" },
  { valor: "trimestre", rotulo: "Trimestre" },
]

const FUSO = "America/Sao_Paulo"

function hora(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSO,
  }).format(new Date(iso))
}

function dataLonga(dia: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  })
    .format(new Date(`${dia}T12:00:00Z`))
    .replace("-feira", "")
    .toUpperCase()
}

function diasAte(iso: string): string {
  const dias = Math.round(
    (Date.parse(iso) - Date.now()) / (24 * 60 * 60 * 1000)
  )
  if (dias <= 0) return "hoje"
  if (dias === 1) return "amanhã"
  return `em ${dias} dias`
}

function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

function Minigrafico({ serie, ativo }: { serie: number[]; ativo?: boolean }) {
  return (
    <svg
      width="100%"
      height="28"
      viewBox="0 0 200 28"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d={caminhoDaSerie(serie, 200, 28)}
        fill="none"
        stroke={ativo ? "#348C98" : "#B7B0A6"}
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function Indicador({
  rotulo,
  valor,
  detalhe,
  detalheForte,
  serie,
  ativo,
}: {
  rotulo: string
  valor: string
  detalhe?: string
  detalheForte?: boolean
  serie?: number[]
  ativo?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border-filete px-6 py-5 not-last:border-r max-lg:not-last:border-r-0 max-lg:not-last:border-b">
      <span className="text-[12.5px] text-tinta-3">{rotulo}</span>
      <div className="flex items-baseline gap-2.5">
        <span className="tabular text-[34px] leading-none font-medium tracking-[-0.035em]">
          {valor}
        </span>
        {detalhe && (
          <span
            className={clsx(
              "text-xs",
              detalheForte
                ? "font-semibold text-turquesa-profundo"
                : "text-tinta-3"
            )}
          >
            {detalhe}
          </span>
        )}
      </div>
      {serie && serie.length > 1 && <Minigrafico serie={serie} ativo={ativo} />}
    </div>
  )
}

/**
 * Início: o que aconteceu desde a meia-noite, quem espera resposta, o dia de
 * hoje e os números do período. Direção visual 02.
 */
export function Inicio() {
  const [janela, setJanela] = useState<JanelaDoInicio>("semana")
  const { user } = useMe()

  const { data, isLoading, error } = useSWR(
    ["inicio", janela],
    () => buscarInicio(janela),
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  )

  const nome = primeiroNome(user?.name)
  const trechos = data ? resumoDoDia(data) : []
  const maisAntiga = data?.aguardando.itens[0]
  const varLeads = data
    ? variacao(data.periodo.leadsNovos, data.periodo.leadsNovosAnterior)
    : null

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="rotulo">{data ? dataLonga(data.dia) : " "}</span>
          <h1 className="font-display text-[48px] leading-none text-tinta max-md:text-[36px]">
            {saudacao()}
            {nome ? `, ${nome}` : ""}.
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div
            role="group"
            aria-label="Período dos números"
            className="flex gap-0.5 rounded-[9px] border border-filete bg-[#F1EEE8] p-[3px]"
          >
            {JANELAS.map((j) => (
              <button
                key={j.valor}
                type="button"
                aria-pressed={janela === j.valor}
                onClick={() => setJanela(j.valor)}
                className={clsx(
                  "h-7 cursor-pointer rounded-[7px] px-3 text-[12.5px] transition-colors",
                  janela === j.valor
                    ? "bg-white font-semibold text-tinta shadow-[0_1px_2px_rgba(21,19,17,0.08)]"
                    : "font-medium text-tinta-3 hover:text-tinta"
                )}
              >
                {j.rotulo}
              </button>
            ))}
          </div>
          <div className="max-md:hidden">
            <NovoLead lead={null} />
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-[#FBEDEA] px-4 py-3 text-sm text-[#A23B2A]">
          Não foi possível carregar o Início. Tente recarregar a página.
        </p>
      )}

      {/* Resumo da manhã */}
      <section
        aria-label="Resumo do dia"
        className="grid overflow-hidden rounded-[14px] bg-ink text-[#F5F2ED] lg:grid-cols-[minmax(0,1fr)_300px]"
      >
        <div className="flex flex-col gap-3.5 px-[30px] py-[26px]">
          <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] text-turquesa-claro">
            <Sparkles size={14} strokeWidth={1.8} />
            {saudacao() === "Bom dia" ? "RESUMO DA MANHÃ" : "RESUMO DE HOJE"} ·
            ASSISTENTE
          </span>
          {isLoading && !data ? (
            <div className="h-16 w-3/4 animate-pulse rounded-lg bg-ink-2" />
          ) : (
            <p className="font-display text-[25px] leading-[1.32] tracking-[-0.01em] text-[#E8E3DB] max-md:text-[21px]">
              {trechos.map((t, i) => (
                <span
                  key={i}
                  className={clsx(
                    t.destaque === "forte" && "text-white",
                    t.destaque === "alerta" && "text-[#F2C77E]"
                  )}
                >
                  {t.texto}
                </span>
              ))}
            </p>
          )}
        </div>
        <div className="flex flex-col border-ink-line max-lg:border-t lg:border-l">
          {maisAntiga && (
            <Link
              href={`/chat?id=${maisAntiga.chatId}`}
              className="flex min-h-14 flex-grow items-center gap-3 border-b border-ink-line px-[22px] text-[13.5px] font-medium text-[#F5F2ED] transition-colors hover:bg-ink-2"
            >
              <span className="flex-grow">
                Responder {primeiroNome(maisAntiga.nome) || maisAntiga.nome}
              </span>
              <ArrowRight size={15} className="text-turquesa-claro" />
            </Link>
          )}
          <Link
            href="/event"
            className="flex min-h-14 flex-grow items-center gap-3 border-b border-ink-line px-[22px] text-[13.5px] font-medium text-[#F5F2ED] transition-colors hover:bg-ink-2"
          >
            <span className="flex-grow">
              {data && data.agenda.length > 0
                ? `Ver ${data.agenda.length === 1 ? "o compromisso" : `os ${data.agenda.length} compromissos`} de hoje`
                : "Abrir a agenda"}
            </span>
            <ArrowRight size={15} className="text-gray-500" />
          </Link>
          <Link
            href="/lead?view=kanban"
            className="flex min-h-14 flex-grow items-center gap-3 px-[22px] text-[13.5px] font-medium text-[#F5F2ED] transition-colors hover:bg-ink-2"
          >
            <span className="flex-grow">Revisar o funil de leads</span>
            <ArrowRight size={15} className="text-gray-500" />
          </Link>
        </div>
      </section>

      {/* Números do período */}
      <section
        aria-label="Números do período"
        className="grid rounded-[14px] border border-filete bg-white lg:grid-cols-4"
      >
        <Indicador
          rotulo="Leads novos"
          valor={String(data?.periodo.leadsNovos ?? "–")}
          detalhe={
            varLeads === null
              ? undefined
              : `${varLeads > 0 ? "+" : ""}${varLeads}%`
          }
          detalheForte
          serie={data?.periodo.serieLeads}
          ativo
        />
        <Indicador
          rotulo="Atendidos pela assistente"
          valor={String(data?.periodo.atendidos ?? "–")}
          detalhe="conversas"
          serie={data?.periodo.serieAtendidos}
        />
        <Indicador
          rotulo="Consultas marcadas"
          valor={String(data?.periodo.consultas ?? "–")}
          detalhe={data ? `${data.agenda.length} hoje` : undefined}
        />
        <Indicador
          rotulo="Honorários fechados"
          valor={data ? emReaisCompacto(data.periodo.honorarios) : "–"}
          detalhe={
            data
              ? `${data.periodo.contratos} ${data.periodo.contratos === 1 ? "contrato" : "contratos"}`
              : undefined
          }
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Aguardando você */}
        <section className="flex min-w-0 flex-col overflow-hidden rounded-[14px] border border-filete bg-white">
          <div className="flex items-center gap-2.5 border-b border-filete px-5 py-4">
            <h2 className="text-[14.5px] font-semibold tracking-[-0.01em]">
              Aguardando você
            </h2>
            <span className="font-mono text-[11px] text-tinta-3">
              {data?.aguardando.total ?? ""}
            </span>
            <span className="flex-grow" />
            <Link
              href="/chat"
              className="text-[12.5px] font-medium text-turquesa-profundo hover:underline"
            >
              Abrir conversas
            </Link>
          </div>

          {data && data.aguardando.itens.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-tinta-3">
              Ninguém esperando resposta. A assistente está dando conta.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr className="border-b border-filete bg-papel">
                    {["Contato", "Última mensagem", "Etapa", "Espera"].map(
                      (c, i) => (
                        <th
                          key={c}
                          className={clsx(
                            "rotulo px-5 py-2.5 font-normal",
                            i === 3 && "text-right"
                          )}
                        >
                          {c}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(data?.aguardando.itens ?? []).map((c) => (
                    <tr
                      key={c.chatId}
                      className="h-14 border-b border-[#F1EEE8] transition-colors last:border-0 hover:bg-papel"
                    >
                      <td className="px-5">
                        <Link
                          href={`/chat?id=${c.chatId}`}
                          className="flex items-center gap-2.5"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-nevoa text-[11px] font-semibold text-turquesa-profundo">
                            {iniciais(c.nome)}
                          </span>
                          <span className="truncate text-[13.5px] font-semibold">
                            {c.nome}
                          </span>
                        </Link>
                      </td>
                      <td className="max-w-[280px] truncate px-5 text-[13px] text-tinta-2">
                        {c.ultimaMensagem ?? (
                          <span className="inline-flex items-center gap-1.5">
                            <FileText size={14} strokeWidth={1.7} />
                            Anexo
                          </span>
                        )}
                      </td>
                      <td className="px-5">
                        {c.etapa && (
                          <span className="inline-flex h-[22px] items-center gap-1.5 rounded-md border border-[#E3DED6] px-2 text-xs whitespace-nowrap text-gray-800">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: c.etapa.color }}
                            />
                            {c.etapa.name}
                          </span>
                        )}
                      </td>
                      <td className="tabular px-5 text-right text-[12.5px] font-semibold whitespace-nowrap text-ambar">
                        {espera(c.desde)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Hoje */}
        <section className="flex flex-col overflow-hidden rounded-[14px] border border-filete bg-white">
          <div className="flex items-center border-b border-filete px-5 py-4">
            <h2 className="flex-grow text-[14.5px] font-semibold">Hoje</h2>
            <Link
              href="/event"
              className="text-[12.5px] font-medium text-turquesa-profundo hover:underline"
            >
              Agenda
            </Link>
          </div>

          <div className="flex flex-col px-5 py-[18px]">
            {data && data.agenda.length === 0 && (
              <p className="py-4 text-sm text-tinta-3">
                Nenhum compromisso hoje.
              </p>
            )}
            {(data?.agenda ?? []).map((e, i, todos) => (
              <div
                key={e.id}
                className="grid min-h-16 grid-cols-[52px_16px_minmax(0,1fr)] gap-2.5"
              >
                <span
                  className={clsx(
                    "tabular pt-px text-[12.5px] font-semibold",
                    i > 0 && "text-tinta-2"
                  )}
                >
                  {hora(e.inicio)}
                </span>
                <span className="flex flex-col items-center">
                  <span
                    className={clsx(
                      "mt-1 h-[9px] w-[9px] rounded-full",
                      i === 0
                        ? "bg-acao shadow-[0_0_0_3px_#D7EBEE]"
                        : "border-2 border-gray-400"
                    )}
                  />
                  {i < todos.length - 1 && (
                    <span className="mt-1.5 w-px flex-grow bg-filete" />
                  )}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5 pb-3">
                  <span className="truncate text-[13.5px] font-semibold">
                    {e.titulo}
                  </span>
                  {e.contato && (
                    <span className="truncate text-xs text-tinta-3">
                      {e.contato}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-2.5 border-t border-filete px-5 pt-3.5 pb-[18px]">
            <span className="rotulo">Prazos da semana</span>
            {data && data.prazos.length === 0 && (
              <span className="text-[13px] text-tinta-3">Nenhum prazo.</span>
            )}
            {(data?.prazos ?? []).map((p, i) => (
              <div key={p.id} className="flex items-center gap-2.5 text-[13px]">
                <span className="min-w-0 flex-grow truncate">{p.titulo}</span>
                {i === 0 ? (
                  <span className="inline-flex h-[22px] items-center rounded-md bg-ambar-fundo px-2 text-xs font-semibold whitespace-nowrap text-ambar">
                    {diasAte(p.data)}
                  </span>
                ) : (
                  <span className="tabular text-xs whitespace-nowrap text-tinta-3">
                    {diasAte(p.data)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
