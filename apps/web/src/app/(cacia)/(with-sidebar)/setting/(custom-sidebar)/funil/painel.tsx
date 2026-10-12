"use client"

import { useEffect, useState } from "react"
import { StageKind } from "@cacia/contracts"

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"

import { Spinner } from "@/components/ui/sppiner"
import { Toast } from "@/components/ui/toast"
import { mensagemDoErro } from "@/http/api-crm"
import {
  atualizarEtapa,
  criarEtapa,
  removerEtapa,
  reordenarEtapas,
} from "@/http/crm/funil"
import { useFunis } from "@/http/hooks/crm"
import type { Etapa } from "@/http/crm/tipos"

import { Cartao } from "../../_ui/cartao"

const CORES = [
  "#3B82F6",
  "#8B5CF6",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#EC4899",
  "#14B8A6",
  "#6B7280",
]

const NATUREZAS: Array<{ valor: StageKind; rotulo: string; ajuda: string }> = [
  {
    valor: StageKind.OPEN,
    rotulo: "Em andamento",
    ajuda: "O negócio segue vivo",
  },
  {
    valor: StageKind.WON,
    rotulo: "Ganho",
    ajuda: "Habilita a conversão em cliente",
  },
  {
    valor: StageKind.LOST,
    rotulo: "Perdido",
    ajuda: "Exige motivo e sai do funil aberto",
  },
]

export function PainelDoFunilDeConfiguracao() {
  const { funis, funilPadrao, isLoading, mutate } = useFunis()

  const [ordem, setOrdem] = useState<Etapa[]>([])
  const [nova, setNova] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const funil = funilPadrao ?? funis[0] ?? null

  useEffect(() => {
    if (funil) setOrdem(funil.stages)
  }, [funil])

  async function executar(acao: () => Promise<unknown>): Promise<void> {
    setOcupado(true)
    setErro(null)

    try {
      await acao()
      await mutate()
    } catch (falha) {
      setErro(await mensagemDoErro(falha))
      // Recarrega também na falha: a lista local pode ter sido reordenada na
      // tela, e deixá-la assim mostraria uma ordem que o servidor não tem.
      await mutate()
    } finally {
      setOcupado(false)
    }
  }

  function mover(indice: number, direcao: -1 | 1): void {
    const destino = indice + direcao

    if (!funil || destino < 0 || destino >= ordem.length) return

    const nova = [...ordem]
    const [movida] = nova.splice(indice, 1)
    nova.splice(destino, 0, movida as Etapa)

    setOrdem(nova)

    void executar(() =>
      reordenarEtapas(
        funil.id,
        nova.map((etapa) => etapa.id)
      )
    )
  }

  if (isLoading && !funil) return <Spinner />

  if (!funil) {
    return (
      <Cartao titulo="Funil de vendas">
        <p className="text-[13.5px] text-tinta-3">
          Não foi possível carregar o funil.
        </p>
      </Cartao>
    )
  }

  function adicionar(): void {
    const nome = nova.trim()
    if (!nome || !funil) return
    setNova("")
    void executar(() =>
      criarEtapa(funil.id, {
        name: nome,
        color: CORES[ordem.length % CORES.length],
      })
    )
  }

  return (
    <Cartao
      titulo="Funil de vendas"
      descricao="As etapas são as colunas do quadro de leads. A ordem define o caminho; a natureza diz ao sistema quais significam fim de linha."
      semRecuo
    >
      <ul className="flex flex-col">
        {ordem.map((etapa, indice) => (
          <li
            key={etapa.id}
            className="flex flex-wrap items-center gap-3 border-t border-[#F1EEE8] px-7 py-3 first:border-t-0 max-md:px-5"
          >
            <div className="flex flex-col">
              <button
                type="button"
                disabled={indice === 0 || ocupado}
                onClick={() => mover(indice, -1)}
                aria-label="Mover para cima"
                className="cursor-pointer rounded text-tinta-3 transition hover:text-tinta disabled:cursor-default disabled:opacity-30"
              >
                <ChevronUp size={15} strokeWidth={1.7} />
              </button>

              <button
                type="button"
                disabled={indice === ordem.length - 1 || ocupado}
                onClick={() => mover(indice, 1)}
                aria-label="Mover para baixo"
                className="cursor-pointer rounded text-tinta-3 transition hover:text-tinta disabled:cursor-default disabled:opacity-30"
              >
                <ChevronDown size={15} strokeWidth={1.7} />
              </button>
            </div>

            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: etapa.color }}
            />

            <input
              defaultValue={etapa.name}
              maxLength={40}
              aria-label={`Nome da etapa ${etapa.name}`}
              onBlur={(evento) => {
                const nome = evento.target.value.trim()
                if (nome && nome !== etapa.name) {
                  void executar(() => atualizarEtapa(etapa.id, { name: nome }))
                }
              }}
              className="h-9 min-w-32 flex-1 rounded-[9px] border border-transparent px-2.5 text-[14px] font-medium text-tinta outline-none transition hover:border-filete-forte focus:border-acao focus:shadow-[0_0_0_3px_#D7EBEE]"
            />

            <button
              type="button"
              disabled={ocupado}
              onClick={() => void executar(() => removerEtapa(etapa.id))}
              aria-label={`Excluir etapa ${etapa.name}`}
              className="flex h-8 w-8 cursor-pointer md:order-last items-center justify-center rounded-lg text-tinta-3 transition hover:bg-[#FBEDEA] hover:text-[#A23B2A] disabled:cursor-default disabled:opacity-30"
            >
              <Trash2 size={15} strokeWidth={1.7} />
            </button>

            <div className="flex items-center gap-1.5">
              {CORES.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  aria-label={`Cor ${cor}`}
                  aria-pressed={etapa.color.toUpperCase() === cor}
                  onClick={() =>
                    void executar(() =>
                      atualizarEtapa(etapa.id, { color: cor })
                    )
                  }
                  style={{ backgroundColor: cor }}
                  className={`h-3.5 w-3.5 cursor-pointer rounded-full transition ${
                    etapa.color.toUpperCase() === cor
                      ? "ring-2 ring-tinta ring-offset-2"
                      : "opacity-40 hover:opacity-100"
                  }`}
                />
              ))}
            </div>

            <select
              value={etapa.kind}
              aria-label={`Natureza da etapa ${etapa.name}`}
              onChange={(evento) =>
                void executar(() =>
                  atualizarEtapa(etapa.id, {
                    kind: evento.target.value as StageKind,
                  })
                )
              }
              title={NATUREZAS.find((n) => n.valor === etapa.kind)?.ajuda ?? ""}
              className="h-9 cursor-pointer rounded-[9px] border border-filete-forte bg-white px-2.5 text-[13px] text-tinta outline-none focus:border-acao"
            >
              {NATUREZAS.map((natureza) => (
                <option key={natureza.valor} value={natureza.valor}>
                  {natureza.rotulo}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 border-t border-filete px-7 py-5 max-md:px-5">
        <div className="flex gap-2">
          <input
            value={nova}
            onChange={(evento) => setNova(evento.target.value)}
            onKeyDown={(evento) => {
              if (evento.key !== "Enter") return
              adicionar()
            }}
            maxLength={40}
            aria-label="Nome da nova etapa"
            placeholder="Nome da nova etapa"
            className="h-11 min-w-0 flex-1 rounded-[10px] border border-filete-forte bg-white px-3.5 text-[15px] text-tinta outline-none transition placeholder:text-gray-400 focus:border-acao focus:shadow-[0_0_0_3px_#D7EBEE]"
          />

          <button
            type="button"
            disabled={ocupado || nova.trim().length === 0}
            onClick={adicionar}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[10px] bg-acao px-4 text-[14px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:bg-acao-escura disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={16} strokeWidth={2} aria-hidden />
            Adicionar
          </button>
        </div>

        <p className="text-[12.5px] text-tinta-3">
          Uma etapa com leads dentro não pode ser excluída — mova-os antes. É
          deliberado: realocar em silêncio faria o funil perder a informação de
          onde cada negócio estava.
        </p>
      </div>

      {erro && (
        <Toast
          title="Não foi possível salvar"
          description={erro}
          variant="error"
          onClose={() => setErro(null)}
        />
      )}
    </Cartao>
  )
}
