"use client"

import { useState } from "react"
import Link from "next/link"

import { Icon } from "@/components/icone"
import { mensagemDoErro } from "@/http/api-crm"
import { confirmarImportacao, enviarPlanilha } from "@/http/crm/importacao"
import type { Importacao } from "@/http/crm/tipos"
import { useEtiquetas, useFunis, useImportacao } from "@/http/hooks/crm"

import { PassoArquivo } from "./passo-arquivo"
import { PassoMapeamento } from "./passo-mapeamento"
import { PassoResultado } from "./passo-resultado"

const PASSOS = ["Arquivo", "Colunas", "Resultado"] as const

export function AssistenteDeImportacao() {
  const { funilPadrao } = useFunis()
  const { etiquetas } = useEtiquetas()

  const [previa, setPrevia] = useState<Importacao | null>(null)
  const [confirmada, setConfirmada] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  // Só acompanha depois de confirmar: antes disso não há nada mudando, e um
  // polling de dois segundos sobre uma prévia parada é bater na API à toa.
  const { importacao } = useImportacao(confirmada)

  const passoAtual = confirmada ? 2 : previa ? 1 : 0

  async function enviar(arquivo: File): Promise<void> {
    setOcupado(true)
    setErro(null)

    try {
      setPrevia(await enviarPlanilha(arquivo))
    } catch (falha) {
      setErro(await mensagemDoErro(falha, "Não foi possível ler o arquivo"))
    } finally {
      setOcupado(false)
    }
  }

  async function confirmar(dados: {
    mapping: Record<string, string>
    stageId?: string
    tagIds: string[]
  }): Promise<void> {
    if (!previa) return

    setOcupado(true)
    setErro(null)

    try {
      await confirmarImportacao(previa.id, dados)
      setConfirmada(previa.id)
    } catch (falha) {
      setErro(await mensagemDoErro(falha))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/lead?view=kanban"
        className="mb-3 inline-flex items-center gap-1 text-xs text-zinc-500 transition hover:text-zinc-700"
      >
        <Icon icon="mdi:arrow-left" className="h-3.5 w-3.5" />
        Voltar ao funil
      </Link>

      <h1 className="text-xl font-semibold text-zinc-900">Importar leads</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Envie um arquivo CSV. Nada é gravado antes de você conferir de qual
        coluna sai cada informação.
      </p>

      <ol className="mt-5 flex items-center gap-2">
        {PASSOS.map((passo, indice) => (
          <li key={passo} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                indice <= passoAtual
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-200 text-zinc-500"
              }`}
            >
              {indice + 1}
            </span>

            <span
              className={`text-sm ${
                indice <= passoAtual ? "text-zinc-900" : "text-zinc-400"
              }`}
            >
              {passo}
            </span>

            {indice < PASSOS.length - 1 && (
              <span className="mx-1 h-px w-8 bg-zinc-200" aria-hidden />
            )}
          </li>
        ))}
      </ol>

      {erro && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </p>
      )}

      <div className="mt-5">
        {passoAtual === 0 && (
          <PassoArquivo ocupado={ocupado} onEnviar={enviar} />
        )}

        {passoAtual === 1 && previa && (
          <PassoMapeamento
            previa={previa}
            etapas={funilPadrao?.stages ?? []}
            etiquetas={etiquetas}
            ocupado={ocupado}
            onVoltar={() => setPrevia(null)}
            onConfirmar={confirmar}
          />
        )}

        {passoAtual === 2 && (
          <PassoResultado importacao={importacao ?? previa} />
        )}
      </div>
    </div>
  )
}
