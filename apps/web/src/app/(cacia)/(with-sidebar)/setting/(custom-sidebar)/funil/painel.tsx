"use client"

import { useEffect, useState } from "react"
import { StageKind } from "@cacia/contracts"

import { Icon } from "@/components/icone"
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
      <p className="py-8 text-sm text-zinc-500">
        Não foi possível carregar o funil.
      </p>
    )
  }

  return (
    <div className="w-full">
      <h1 className="text-lg font-semibold text-zinc-900">Funil de vendas</h1>
      <p className="mt-1 text-sm text-zinc-500">
        As etapas são as colunas do quadro de leads. A ordem define o caminho; a
        natureza diz ao sistema quais significam fim de linha.
      </p>

      <ul className="mt-5 space-y-2">
        {ordem.map((etapa, indice) => (
          <li
            key={etapa.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3"
          >
            <div className="flex flex-col">
              <button
                type="button"
                disabled={indice === 0 || ocupado}
                onClick={() => mover(indice, -1)}
                aria-label="Mover para cima"
                className="text-zinc-400 transition hover:text-zinc-700 disabled:opacity-30"
              >
                <Icon icon="mdi:chevron-up" className="h-4 w-4" />
              </button>

              <button
                type="button"
                disabled={indice === ordem.length - 1 || ocupado}
                onClick={() => mover(indice, 1)}
                aria-label="Mover para baixo"
                className="text-zinc-400 transition hover:text-zinc-700 disabled:opacity-30"
              >
                <Icon icon="mdi:chevron-down" className="h-4 w-4" />
              </button>
            </div>

            <input
              defaultValue={etapa.name}
              maxLength={40}
              onBlur={(evento) => {
                const nome = evento.target.value.trim()
                if (nome && nome !== etapa.name) {
                  void executar(() => atualizarEtapa(etapa.id, { name: nome }))
                }
              }}
              className="min-w-32 flex-1 rounded-lg border border-transparent px-2 py-1 text-sm font-medium text-zinc-800 outline-none transition hover:border-zinc-200 focus:border-zinc-400"
            />

            <div className="flex items-center gap-1">
              {CORES.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  aria-label={`Cor ${cor}`}
                  onClick={() =>
                    void executar(() =>
                      atualizarEtapa(etapa.id, { color: cor })
                    )
                  }
                  style={{ backgroundColor: cor }}
                  className={`h-4 w-4 rounded-full transition ${
                    etapa.color.toUpperCase() === cor
                      ? "ring-2 ring-zinc-900 ring-offset-1"
                      : "opacity-50 hover:opacity-100"
                  }`}
                />
              ))}
            </div>

            <select
              value={etapa.kind}
              onChange={(evento) =>
                void executar(() =>
                  atualizarEtapa(etapa.id, {
                    kind: evento.target.value as StageKind,
                  })
                )
              }
              title={NATUREZAS.find((n) => n.valor === etapa.kind)?.ajuda ?? ""}
              className="rounded-lg border border-zinc-200 px-2 py-1 text-xs outline-none"
            >
              {NATUREZAS.map((natureza) => (
                <option key={natureza.valor} value={natureza.valor}>
                  {natureza.rotulo}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={ocupado}
              onClick={() => void executar(() => removerEtapa(etapa.id))}
              aria-label={`Excluir etapa ${etapa.name}`}
              className="text-zinc-400 transition hover:text-red-600 disabled:opacity-30"
            >
              <Icon icon="mdi:trash-can-outline" className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex gap-2">
        <input
          value={nova}
          onChange={(evento) => setNova(evento.target.value)}
          onKeyDown={(evento) => {
            if (evento.key !== "Enter") return
            const nome = nova.trim()
            if (!nome) return
            setNova("")
            void executar(() =>
              criarEtapa(funil.id, {
                name: nome,
                color: CORES[ordem.length % CORES.length],
              })
            )
          }}
          maxLength={40}
          placeholder="Nome da nova etapa"
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />

        <button
          type="button"
          disabled={ocupado || nova.trim().length === 0}
          onClick={() => {
            const nome = nova.trim()
            setNova("")
            void executar(() =>
              criarEtapa(funil.id, {
                name: nome,
                color: CORES[ordem.length % CORES.length],
              })
            )
          }}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40"
        >
          Adicionar
        </button>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Uma etapa com leads dentro não pode ser excluída — mova-os antes. É
        deliberado: realocar em silêncio faria o funil perder a informação de
        onde cada negócio estava.
      </p>

      {erro && (
        <Toast
          title="Não foi possível salvar"
          description={erro}
          variant="error"
          onClose={() => setErro(null)}
        />
      )}
    </div>
  )
}
