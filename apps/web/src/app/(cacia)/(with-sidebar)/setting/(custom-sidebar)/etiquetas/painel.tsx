"use client"

import { useState } from "react"

import { Plus, Trash2 } from "lucide-react"

import { Spinner } from "@/components/ui/sppiner"
import { Toast } from "@/components/ui/toast"
import { EtiquetaBadge } from "@/components/crm/etiqueta"
import { mensagemDoErro } from "@/http/api-crm"
import {
  atualizarEtiqueta,
  criarEtiqueta,
  removerEtiqueta,
} from "@/http/crm/etiquetas"
import { useEtiquetas } from "@/http/hooks/crm"

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

export function PainelDeEtiquetas() {
  const { etiquetas, isLoading, mutate } = useEtiquetas()

  const [nova, setNova] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [confirmando, setConfirmando] = useState<string | null>(null)

  async function executar(acao: () => Promise<unknown>): Promise<void> {
    setOcupado(true)
    setErro(null)

    try {
      await acao()
      await mutate()
    } catch (falha) {
      setErro(await mensagemDoErro(falha))
    } finally {
      setOcupado(false)
    }
  }

  function adicionar(): void {
    const nome = nova.trim()
    if (!nome) return

    setNova("")
    void executar(() =>
      criarEtiqueta({
        name: nome,
        // Cor rotativa: cinco etiquetas cinzas não se distinguem no cartão
        color: CORES[etiquetas.length % CORES.length],
      })
    )
  }

  if (isLoading && etiquetas.length === 0) return <Spinner />

  return (
    <Cartao
      titulo={
        <span className="flex items-baseline gap-2">
          Etiquetas
          <span className="font-mono text-xs font-normal text-tinta-3 tabular">
            {etiquetas.length}
          </span>
        </span>
      }
      descricao="Marcam leads e clientes por assunto ou perfil, e servem de filtro no funil. Nada aqui entra no contexto do assistente — são organização humana."
      semRecuo
    >
      <div className="flex gap-2 border-b border-filete px-7 py-5 max-md:px-5">
        <input
          value={nova}
          onChange={(evento) => setNova(evento.target.value)}
          onKeyDown={(evento) => {
            if (evento.key === "Enter") adicionar()
          }}
          maxLength={40}
          aria-label="Nome da nova etiqueta"
          placeholder="Nome da nova etiqueta"
          className="h-11 min-w-0 flex-1 rounded-[10px] border border-filete-forte bg-white px-3.5 text-[15px] text-tinta outline-none transition placeholder:text-gray-400 focus:border-acao focus:shadow-[0_0_0_3px_#D7EBEE]"
        />

        <button
          type="button"
          disabled={ocupado || nova.trim().length === 0}
          onClick={adicionar}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[10px] bg-acao px-4 text-[14px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:bg-acao-escura disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} strokeWidth={2} aria-hidden />
          Criar
        </button>
      </div>

      {etiquetas.length === 0 ? (
        <p className="px-7 py-6 text-[13.5px] text-tinta-3 max-md:px-5">
          Nenhuma etiqueta cadastrada ainda.
        </p>
      ) : (
        <ul className="flex flex-col">
          {etiquetas.map((etiqueta) => {
            const usos =
              (etiqueta._count?.leads ?? 0) + (etiqueta._count?.customers ?? 0)

            return (
              <li
                key={etiqueta.id}
                className="flex flex-wrap items-center gap-3 border-t border-[#F1EEE8] px-7 py-3 first:border-t-0 max-md:px-5"
              >
                <EtiquetaBadge etiqueta={etiqueta} />

                <input
                  defaultValue={etiqueta.name}
                  maxLength={40}
                  aria-label={`Nome da etiqueta ${etiqueta.name}`}
                  onBlur={(evento) => {
                    const nome = evento.target.value.trim()
                    if (nome && nome !== etiqueta.name) {
                      void executar(() =>
                        atualizarEtiqueta(etiqueta.id, { name: nome })
                      )
                    }
                  }}
                  className="h-9 min-w-32 flex-1 rounded-[9px] border border-transparent px-2.5 text-[14px] text-tinta outline-none transition hover:border-filete-forte focus:border-acao focus:shadow-[0_0_0_3px_#D7EBEE]"
                />

                <div className="flex items-center gap-1.5">
                  {CORES.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      aria-label={`Cor ${cor}`}
                      aria-pressed={etiqueta.color.toUpperCase() === cor}
                      onClick={() =>
                        void executar(() =>
                          atualizarEtiqueta(etiqueta.id, { color: cor })
                        )
                      }
                      style={{ backgroundColor: cor }}
                      className={`h-3.5 w-3.5 cursor-pointer rounded-full transition ${
                        etiqueta.color.toUpperCase() === cor
                          ? "ring-2 ring-tinta ring-offset-2"
                          : "opacity-40 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>

                <span className="w-[72px] text-right font-mono text-[11.5px] text-tinta-3 tabular">
                  {usos === 0 ? "não usada" : `${usos} uso(s)`}
                </span>

                {confirmando === etiqueta.id ? (
                  <span className="flex items-center gap-1 text-[12.5px]">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmando(null)
                        void executar(() => removerEtiqueta(etiqueta.id))
                      }}
                      className="h-8 cursor-pointer rounded-lg bg-[#FBEDEA] px-2.5 font-medium text-[#A23B2A] transition hover:bg-[#F6DDD7]"
                    >
                      Excluir mesmo
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmando(null)}
                      className="h-8 cursor-pointer rounded-lg px-2.5 text-tinta-2 transition hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() => setConfirmando(etiqueta.id)}
                    aria-label={`Excluir etiqueta ${etiqueta.name}`}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-tinta-3 transition hover:bg-[#FBEDEA] hover:text-[#A23B2A] disabled:cursor-default disabled:opacity-30"
                  >
                    <Trash2 size={15} strokeWidth={1.7} />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <p className="border-t border-filete px-7 py-4 text-[12.5px] text-tinta-3 max-md:px-5">
        Excluir uma etiqueta a remove de todos os leads e clientes que a tinham.
        Não há como desfazer.
      </p>

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
