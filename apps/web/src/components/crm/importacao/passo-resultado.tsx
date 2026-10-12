"use client"

import Link from "next/link"

import type { Importacao } from "@/http/crm/tipos"

const EM_ANDAMENTO = new Set(["QUEUED", "RUNNING"])

function Numero({
  valor,
  rotulo,
  cor,
}: {
  valor: number
  rotulo: string
  cor: string
}) {
  return (
    <div className="rounded-[14px] border border-filete bg-white px-4 py-3">
      <p className={`tabular font-display text-[32px] leading-none ${cor}`}>
        {valor}
      </p>
      <p className="mt-1.5 text-xs text-tinta-3">{rotulo}</p>
    </div>
  )
}

/**
 * O que aconteceu com a planilha.
 *
 * Os três números são distintos de propósito: importado, já existente e com
 * erro. Somar "não importado" num número só esconderia a diferença entre um
 * reenvio inofensivo e uma planilha com metade dos telefones errados.
 */
export function PassoResultado({
  importacao,
}: {
  importacao: Importacao | null
}) {
  if (!importacao) {
    return <p className="text-sm text-tinta-3">Carregando…</p>
  }

  const rodando = EM_ANDAMENTO.has(importacao.status)
  const processadas =
    importacao.importedRows + importacao.skippedRows + importacao.failedRows
  const progresso =
    importacao.totalRows > 0
      ? Math.round((processadas / importacao.totalRows) * 100)
      : 0

  return (
    <div>
      {rodando && (
        <div className="mb-4">
          <p className="mb-1.5 text-[13.5px] text-tinta-2">
            Importando… {processadas} de {importacao.totalRows}
          </p>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-filete">
            <div
              className="h-full bg-acao transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>

          <p className="mt-1.5 text-xs text-tinta-3">
            Pode fechar esta tela — a importação continua no servidor.
          </p>
        </div>
      )}

      {importacao.status === "FAILED" && (
        <p className="mb-4 rounded-xl bg-[#FBEDEA] px-4 py-3 text-sm text-[#A23B2A]">
          A importação falhou: {importacao.errorMessage ?? "erro desconhecido"}.
          O que já havia entrado foi mantido.
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Numero
          valor={importacao.importedRows}
          rotulo="leads criados"
          cor="text-turquesa-profundo"
        />
        <Numero
          valor={importacao.skippedRows}
          rotulo="já existiam"
          cor="text-tinta"
        />
        <Numero
          valor={importacao.failedRows}
          rotulo="com erro"
          cor="text-[#A23B2A]"
        />
      </div>

      {(importacao.errors ?? []).length > 0 && (
        <div className="mt-4 overflow-hidden rounded-[14px] border border-filete bg-white">
          <p className="border-b border-filete px-4 py-3 text-[14.5px] font-semibold text-tinta">
            Linhas que não entraram
          </p>

          <ul className="max-h-64 divide-y divide-[#F1EEE8] overflow-y-auto text-[13px]">
            {(importacao.errors ?? []).map((erro) => (
              <li
                key={erro.linha}
                className="flex gap-3 px-4 py-2 text-tinta-2"
              >
                <span className="tabular w-16 shrink-0 text-tinta-3">
                  linha {erro.linha}
                </span>
                <span>{erro.motivo}</span>
              </li>
            ))}
          </ul>

          <p className="border-t border-filete px-4 py-2.5 text-xs text-tinta-3">
            Corrija essas linhas na planilha e envie de novo — os contatos que
            já entraram serão ignorados.
          </p>
        </div>
      )}

      {!rodando && (
        <div className="mt-5 flex gap-2">
          <Link
            href="/lead?view=kanban"
            className="flex h-9 cursor-pointer items-center rounded-[9px] bg-acao px-3.5 text-[13.5px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:bg-acao-escura disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ver no funil
          </Link>

          <Link
            href="/lead/import"
            className="flex h-9 items-center rounded-[9px] border border-filete-forte bg-white px-3.5 text-[13.5px] font-medium text-tinta transition hover:bg-gray-100"
          >
            Importar outra planilha
          </Link>
        </div>
      )}
    </div>
  )
}
