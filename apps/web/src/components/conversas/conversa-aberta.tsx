"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import clsx from "clsx"
import useSWRInfinite from "swr/infinite"
import { format, isSameDay, isToday, isYesterday } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Icon } from "@/components/icone"
import { mensagemDoErro } from "@/http/api-crm"
import {
  assumirConversa,
  devolverParaIa,
  encerrarConversa,
  enviarAnexo,
  enviarMensagem,
  listarMensagens,
  nomeDoContato,
  telefoneDoContato,
  type Conversa,
  type Mensagem,
} from "@/http/crm/conversas"
import { formatPhone } from "@/utils/formatters"

import { ConteudoDoAnexo, temAnexo, useLinksEstaveis } from "./anexo"
import { useGravador } from "./gravador"

/** Mesmo teto da API; recusar aqui poupa o upload inteiro. */
const TAMANHO_MAXIMO = 16 * 1024 * 1024

function relogio(segundos: number): string {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

const POR_PAGINA = 40

/** Mensagens novas aparecem sem recarregar: a conversa aberta consulta a API. */
const INTERVALO_MS = 4000

/** Quão perto do fim a pessoa precisa estar para a tela acompanhar as novas. */
const PERTO_DO_FIM_PX = 160

function rotuloDoDia(data: Date): string {
  if (isToday(data)) return "Hoje"
  if (isYesterday(data)) return "Ontem"
  return format(data, "d 'de' MMMM", { locale: ptBR })
}

const SITUACAO: Record<
  Conversa["status"],
  { rotulo: string; classe: string; icon: string }
> = {
  ACTIVE: {
    rotulo: "Com a assistente",
    classe: "bg-nevoa text-turquesa-profundo",
    icon: "mdi:robot-outline",
  },
  PENDING: {
    rotulo: "Com você",
    classe: "bg-ambar-fundo text-ambar",
    icon: "mdi:account-tie-outline",
  },
  COMPLETED: {
    rotulo: "Encerrada",
    classe: "bg-gray-100 text-tinta-2",
    icon: "mdi:check-circle-outline",
  },
  CANCELLED: {
    rotulo: "Cancelada",
    classe: "bg-gray-100 text-tinta-2",
    icon: "mdi:close-circle-outline",
  },
}

function Estado({ mensagem }: { mensagem: Mensagem }) {
  if (mensagem.status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-0.5 text-red-600">
        <Icon icon="mdi:alert-circle-outline" className="h-3.5 w-3.5" />
        não enviada
      </span>
    )
  }

  if (mensagem.status === "PENDING") {
    return <Icon icon="mdi:clock-outline" className="h-3.5 w-3.5" />
  }

  const titulo =
    mensagem.status === "SENT"
      ? "Enviada"
      : mensagem.status === "DELIVERED"
        ? "Entregue"
        : "Lida"

  return (
    <span title={titulo} className="inline-flex">
      {/* Cada nome literal em seu próprio `icon=`: é o que o gerador de
          ícones (scripts/gerar-icones.mjs) enxerga */}
      {mensagem.status === "SENT" ? (
        <Icon icon="mdi:check" className="h-3.5 w-3.5" />
      ) : (
        <Icon
          icon="mdi:check-all"
          className={clsx(
            "h-3.5 w-3.5",
            mensagem.status === "READ" && "text-sky-400"
          )}
        />
      )}
    </span>
  )
}

function Balao({ mensagem, url }: { mensagem: Mensagem; url: string | null }) {
  if (mensagem.sender === "SYSTEM") {
    return (
      <div className="my-2 self-center rounded-full bg-ambar-fundo px-3 py-1.5 text-center text-xs text-ambar">
        {mensagem.messageText}
      </div>
    )
  }

  const nossa = mensagem.sender === "USER" || mensagem.sender === "AGENT"
  const daIa = mensagem.sender === "AGENT"
  const falhou = nossa && mensagem.status === "FAILED"
  const escura = nossa && !daIa && !falhou
  const texto = mensagem.messageText ?? mensagem.messageCaption

  return (
    <div className={clsx("flex", nossa ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[62%] rounded-[14px] px-3.5 py-2.5 text-[14px] leading-normal max-md:max-w-[84%]",
          !nossa && "rounded-bl-[4px] border border-filete bg-white text-tinta",
          escura && "rounded-br-[4px] bg-grafite text-[#F5F2ED]",
          daIa && !falhou && "rounded-br-[4px] bg-[#E4F0F1] text-[#173E43]",
          falhou &&
            "rounded-br-[4px] border border-red-200 bg-red-50 text-tinta"
        )}
      >
        {daIa && (
          <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-turquesa-profundo">
            <Icon icon="mdi:robot-outline" className="h-3 w-3" />
            Assistente
          </div>
        )}

        {temAnexo(mensagem) && (
          <ConteudoDoAnexo mensagem={mensagem} url={url} escura={escura} />
        )}

        {texto && <p className="whitespace-pre-wrap break-words">{texto}</p>}

        <div
          className={clsx(
            "mt-0.5 flex items-center justify-end gap-1 text-[10px]",
            escura ? "text-white/60" : "text-tinta-3"
          )}
        >
          {format(new Date(mensagem.createdAt), "HH:mm")}
          {nossa && <Estado mensagem={mensagem} />}
        </div>
      </div>
    </div>
  )
}

export function ConversaAberta({
  conversa,
  aoVoltar,
  aoMudar,
}: {
  conversa: Conversa
  /** Só no celular, onde lista e conversa não cabem lado a lado. */
  aoVoltar: () => void
  /** A lista precisa refletir envio, assumir e devolver na hora. */
  aoMudar: () => void
}) {
  const nome = nomeDoContato(conversa)
  const telefone = telefoneDoContato(conversa)
  const situacao = SITUACAO[conversa.status]

  const { data, size, setSize, isLoading, mutate } = useSWRInfinite(
    (pagina, anterior: { meta: { totalPages: number } } | null) => {
      if (anterior && pagina >= anterior.meta.totalPages) return null
      return ["conversas:mensagens", conversa.id, pagina + 1]
    },
    ([, id, pagina]) =>
      listarMensagens(id as string, pagina as number, POR_PAGINA),
    { refreshInterval: INTERVALO_MS, revalidateOnFocus: true }
  )

  const temMaisAntigas = !!data && size < (data[0]?.meta.totalPages ?? 1)

  // A API devolve da mais nova para a mais antiga; a tela lê de cima para baixo
  const mensagens = (data ?? []).flatMap((p) => p.data).reverse()

  const [texto, setTexto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [trocandoModo, setTrocandoModo] = useState(false)

  const linkDe = useLinksEstaveis()
  const gravador = useGravador()
  const seletor = useRef<HTMLInputElement>(null)

  const rolagem = useRef<HTMLDivElement>(null)
  const campo = useRef<HTMLTextAreaElement>(null)
  const pertoDoFim = useRef(true)
  const alturaAntes = useRef<number | null>(null)
  const conteudo = useRef<HTMLDivElement>(null)
  const ultimaId = mensagens.at(-1)?.id

  // Troca de conversa: limpa o rascunho e volta a acompanhar o fim
  useEffect(() => {
    setTexto("")
    setErro(null)
    pertoDoFim.current = true
  }, [conversa.id])

  useLayoutEffect(() => {
    const el = rolagem.current
    if (!el) return

    // Carregou mensagens antigas no topo: mantém o ponto de leitura
    if (alturaAntes.current !== null) {
      el.scrollTop = el.scrollHeight - alturaAntes.current
      alturaAntes.current = null
      return
    }

    // Mensagem nova: acompanha só se a pessoa já estava lendo o fim, para
    // não arrancá-la do meio do histórico
    if (pertoDoFim.current) el.scrollTop = el.scrollHeight
  }, [ultimaId, mensagens.length])

  // Imagem e áudio terminam de carregar depois da rolagem e empurram o fim
  // para baixo. Quem estava no fim continua no fim.
  useEffect(() => {
    const el = conteudo.current
    if (!el || typeof ResizeObserver === "undefined") return

    const observador = new ResizeObserver(() => {
      const caixa = rolagem.current
      if (caixa && pertoDoFim.current && alturaAntes.current === null) {
        caixa.scrollTop = caixa.scrollHeight
      }
    })

    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  function aoRolar() {
    const el = rolagem.current
    if (!el) return
    pertoDoFim.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < PERTO_DO_FIM_PX
  }

  function carregarAntigas() {
    alturaAntes.current = rolagem.current?.scrollHeight ?? null
    void setSize(size + 1)
  }

  async function enviar() {
    const conteudo = texto.trim()
    if (!conteudo || enviando) return

    await publicar(() => enviarMensagem(conversa.id, conteudo))
  }

  /** O texto já digitado vai junto, como legenda do arquivo. */
  async function enviarArquivo(arquivo: File) {
    if (arquivo.size > TAMANHO_MAXIMO) {
      setErro("Arquivo acima de 16 MB")
      return
    }

    await publicar(() =>
      enviarAnexo(conversa.id, arquivo, arquivo.name, texto.trim() || undefined)
    )
  }

  async function concluirGravacao(aproveitar: boolean) {
    const audio = await gravador.parar(aproveitar)
    if (!audio) return

    await publicar(() => enviarAnexo(conversa.id, audio.arquivo, audio.nome), {
      manterTexto: true,
    })
  }

  async function publicar(
    envio: () => Promise<Mensagem>,
    { manterTexto = false } = {}
  ) {
    if (enviando) return

    setEnviando(true)
    setErro(null)

    try {
      const criada = await envio()
      if (!manterTexto) setTexto("")
      pertoDoFim.current = true

      // Entra já na tela, com o relógio; o intervalo traz o "enviada" depois
      await mutate(
        (paginas) =>
          paginas?.map((p, i) =>
            i === 0 ? { ...p, data: [criada, ...p.data] } : p
          ),
        { revalidate: true }
      )
      aoMudar()
    } catch (falha) {
      setErro(await mensagemDoErro(falha, "Não foi possível enviar a mensagem"))
    } finally {
      setEnviando(false)
      campo.current?.focus()
    }
  }

  async function trocarModo(acao: "assumir" | "devolver" | "encerrar") {
    setTrocandoModo(true)
    setErro(null)

    try {
      if (acao === "assumir") await assumirConversa(conversa.id)
      if (acao === "devolver") await devolverParaIa(conversa.id)
      if (acao === "encerrar") await encerrarConversa(conversa.id)
      aoMudar()
    } catch (falha) {
      setErro(await mensagemDoErro(falha))
    } finally {
      setTrocandoModo(false)
    }
  }

  const fichaHref = conversa.customerId
    ? `/customer/${conversa.customerId}`
    : conversa.leadId
      ? `/lead/${conversa.leadId}`
      : null

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Cabeçalho: quem é, em que etapa está, quem está respondendo */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-filete bg-papel px-6">
        <button
          type="button"
          onClick={aoVoltar}
          className="-ml-1 rounded-md p-1 text-tinta-3 hover:bg-gray-100 lg:hidden"
          aria-label="Voltar para a lista"
        >
          <Icon icon="mdi:arrow-left" className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-[15px] font-semibold text-tinta">
              {nome}
            </h2>
            {conversa.lead?.stage && (
              <span
                className="inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-md border border-[#E3DED6] px-2 text-xs text-gray-800"
                title="Etapa no funil"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: conversa.lead.stage.color }}
                />
                {conversa.lead.stage.name}
              </span>
            )}
          </div>
          <p className="tabular truncate text-xs text-tinta-3">
            {telefone ? formatPhone(telefone) : "Sem telefone"}
            {conversa.customerId ? " · Cliente" : " · Lead"}
            {fichaHref && (
              <>
                {" · "}
                <Link
                  href={fichaHref}
                  className="text-turquesa-profundo underline-offset-2 hover:underline"
                >
                  {conversa.customerId ? "ver cliente" : "ver ficha do lead"}
                </Link>
              </>
            )}
          </p>
        </div>

        <span
          className={clsx(
            "hidden shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex",
            situacao.classe
          )}
        >
          <Icon icon={situacao.icon} className="h-3.5 w-3.5" />
          {situacao.rotulo}
        </span>

        {conversa.status === "ACTIVE" ? (
          <button
            type="button"
            disabled={trocandoModo}
            onClick={() => trocarModo("assumir")}
            className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-tinta px-3 text-[13px] font-semibold text-papel transition hover:bg-grafite disabled:opacity-60"
            aria-label="Assumir conversa"
          >
            <Icon
              icon="mdi:account-tie-outline"
              className="h-4 w-4 sm:hidden"
            />
            <span className="max-sm:hidden">Assumir conversa</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={trocandoModo}
            onClick={() => trocarModo("devolver")}
            className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-filete-forte bg-white px-3 text-[13px] font-medium text-tinta transition hover:bg-[#F4F8F9] disabled:opacity-60"
            aria-label="Devolver à assistente"
          >
            <Icon icon="mdi:robot-outline" className="h-4 w-4 sm:hidden" />
            <span className="max-sm:hidden">Devolver à assistente</span>
          </button>
        )}

        {conversa.status === "PENDING" && (
          <button
            type="button"
            disabled={trocandoModo}
            onClick={() => trocarModo("encerrar")}
            className="shrink-0 cursor-pointer rounded-lg p-1.5 text-tinta-3 transition hover:bg-gray-100 disabled:opacity-60"
            title="Encerrar conversa"
            aria-label="Encerrar conversa"
          >
            <Icon icon="mdi:check-circle-outline" className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Histórico */}
      <div
        ref={rolagem}
        onScroll={aoRolar}
        className="min-h-0 flex-1 overflow-y-auto bg-papel-2 px-14 py-6 max-lg:px-4"
      >
        <div ref={conteudo} className="min-h-full space-y-2.5">
          {temMaisAntigas && (
            <div className="mb-2 text-center">
              <button
                type="button"
                onClick={carregarAntigas}
                className="cursor-pointer rounded-full border border-filete bg-white px-3 py-1 text-xs text-tinta-2 hover:text-tinta"
              >
                Carregar mensagens anteriores
              </button>
            </div>
          )}

          {isLoading && mensagens.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <Icon
                icon="mdi:loading"
                className="h-6 w-6 animate-spin text-acao"
              />
            </div>
          ) : mensagens.length === 0 ? (
            <p className="pt-10 text-center text-sm text-tinta-3">
              Nenhuma mensagem nesta conversa.
            </p>
          ) : (
            mensagens.map((m, i) => {
              const data = new Date(m.createdAt)
              const anterior = mensagens[i - 1]
              const novoDia =
                !anterior || !isSameDay(new Date(anterior.createdAt), data)

              return (
                <div key={m.id}>
                  {novoDia && (
                    <div className="my-4 flex items-center gap-3">
                      <span className="h-px flex-grow bg-[#E3DED6]" />
                      <span className="font-mono text-[10.5px] tracking-[0.08em] text-tinta-3 uppercase">
                        {rotuloDoDia(data)}
                      </span>
                      <span className="h-px flex-grow bg-[#E3DED6]" />
                    </div>
                  )}
                  <Balao mensagem={m} url={linkDe(m)} />
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Resposta */}
      <div className="shrink-0 bg-papel-2 px-6 pt-1 pb-5 max-lg:px-3">
        {conversa.status === "ACTIVE" && (
          <p className="mb-2 flex items-center gap-1.5 text-xs text-tinta-3">
            <Icon icon="mdi:information-outline" className="h-3.5 w-3.5" />A IA
            está respondendo. Ao enviar uma mensagem, você assume a conversa e a
            IA para.
          </p>
        )}

        {(erro ?? gravador.erro) && (
          <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {erro ?? gravador.erro}
          </p>
        )}

        {gravador.gravando ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void concluirGravacao(false)}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[9px] text-tinta-3 transition hover:bg-gray-100"
              aria-label="Descartar áudio"
              title="Descartar"
            >
              <Icon icon="mdi:delete-outline" className="h-5 w-5" />
            </button>

            <div className="flex h-10 flex-1 items-center gap-2 rounded-xl bg-red-50 px-3 text-sm text-red-700">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
              Gravando {relogio(gravador.segundos)}
            </div>

            <button
              type="button"
              onClick={() => void concluirGravacao(true)}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[9px] bg-acao text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:bg-acao-escura"
              aria-label="Enviar áudio"
              title="Enviar áudio"
            >
              <Icon icon="mdi:send" className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-1.5 rounded-[14px] border border-filete-forte bg-white p-2 shadow-[0_1px_2px_rgba(21,19,17,0.04)] focus-within:border-acao focus-within:shadow-[0_0_0_3px_#D7EBEE]">
            <input
              ref={seletor}
              type="file"
              className="hidden"
              accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={(e) => {
                const arquivo = e.target.files?.[0]
                e.target.value = ""
                if (arquivo) void enviarArquivo(arquivo)
              }}
            />
            <button
              type="button"
              onClick={() => seletor.current?.click()}
              disabled={enviando}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[9px] text-tinta-3 transition hover:bg-gray-100 hover:text-tinta disabled:opacity-50"
              aria-label="Anexar arquivo"
              title="Anexar arquivo (o texto digitado vai como legenda)"
            >
              <Icon icon="mdi:paperclip" className="h-5 w-5" />
            </button>

            <textarea
              ref={campo}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                // Enter envia; Shift+Enter quebra a linha
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault()
                  void enviar()
                }
              }}
              rows={1}
              placeholder="Escreva uma mensagem"
              className="max-h-40 min-h-9 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[14px] text-tinta outline-none [field-sizing:content] focus:border-[#348C98] focus:ring-2 focus:ring-[#348C98]/20"
            />
            {/* Caixa vazia: o botão grava áudio, como no WhatsApp */}
            {!texto.trim() && !enviando && gravador.disponivel ? (
              <button
                type="button"
                onClick={() => void gravador.iniciar()}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[9px] bg-acao text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:bg-acao-escura"
                aria-label="Gravar áudio"
                title="Gravar áudio"
              >
                <Icon icon="mdi:microphone" className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void enviar()}
                disabled={!texto.trim() || enviando}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[9px] bg-acao text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:bg-acao-escura disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Enviar"
              >
                {enviando ? (
                  <Icon icon="mdi:loading" className="h-5 w-5 animate-spin" />
                ) : (
                  <Icon icon="mdi:send" className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
