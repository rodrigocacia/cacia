"use client"

import { useState } from "react"
import Link from "next/link"

import { ArrowLeft } from "lucide-react"
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
    <div className="w-full max-w-3xl">
      <Link
        href="/lead?view=kanban"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-tinta-3 transition hover:text-tinta"
      >
        <ArrowLeft size={14} />
        Voltar ao funil
      </Link>

      <h1 className="font-display text-[44px] leading-none text-tinta max-md:text-[34px]">
        Importar leads
      </h1>
      <p className="mt-2 text-[13.5px] text-tinta-2">
        Envie um arquivo CSV. Nada é gravado antes de você conferir de qual
        coluna sai cada informação.
      </p>

      <ol className="mt-6 flex flex-wrap items-center gap-2">
        {PASSOS.map((passo, indice) => (
          <li key={passo} className="flex items-center gap-2">
            <span
              className={`tabular flex h-6 w-6 items-center justify-center rounded-md font-mono text-[11px] ${
                indice <= passoAtual
                  ? "bg-acao text-white"
                  : "border border-filete-forte bg-white text-tinta-3"
              }`}
            >
              {indice + 1}
            </span>

            <span
              className={`text-[13.5px] ${
                indice === passoAtual
                  ? "font-semibold text-tinta"
                  : indice < passoAtual
                    ? "text-tinta-2"
                    : "text-tinta-3"
              }`}
            >
              {passo}
            </span>

            {indice < PASSOS.length - 1 && (
              <span className="mx-1 h-px w-8 bg-filete-forte" aria-hidden />
            )}
          </li>
        ))}
      </ol>

      {erro && (
        <p className="mt-4 rounded-xl bg-[#FBEDEA] px-4 py-3 text-sm text-[#A23B2A]">
          {erro}
        </p>
      )}

      <div className="mt-6">
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
