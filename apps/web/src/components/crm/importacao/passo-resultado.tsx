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
    <div className="rounded-lg border border-zinc-200 px-3 py-2">
      <p className={`text-xl font-semibold ${cor}`}>{valor}</p>
      <p className="text-xs text-zinc-500">{rotulo}</p>
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
    return <p className="text-sm text-zinc-500">Carregando…</p>
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
          <p className="mb-1.5 text-sm text-zinc-600">
            Importando… {processadas} de {importacao.totalRows}
          </p>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full bg-zinc-900 transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>

          <p className="mt-1.5 text-xs text-zinc-500">
            Pode fechar esta tela — a importação continua no servidor.
          </p>
        </div>
      )}

      {importacao.status === "FAILED" && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          A importação falhou: {importacao.errorMessage ?? "erro desconhecido"}.
          O que já havia entrado foi mantido.
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Numero
          valor={importacao.importedRows}
          rotulo="leads criados"
          cor="text-emerald-700"
        />
        <Numero
          valor={importacao.skippedRows}
          rotulo="já existiam"
          cor="text-zinc-700"
        />
        <Numero
          valor={importacao.failedRows}
          rotulo="com erro"
          cor="text-red-700"
        />
      </div>

      {(importacao.errors ?? []).length > 0 && (
        <div className="mt-4 rounded-xl border border-zinc-200">
          <p className="border-b border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700">
            Linhas que não entraram
          </p>

          <ul className="max-h-64 divide-y divide-zinc-100 overflow-y-auto text-sm">
            {(importacao.errors ?? []).map((erro) => (
              <li
                key={erro.linha}
                className="flex gap-3 px-3 py-1.5 text-zinc-600"
              >
                <span className="w-16 shrink-0 text-zinc-400">
                  linha {erro.linha}
                </span>
                <span>{erro.motivo}</span>
              </li>
            ))}
          </ul>

          <p className="border-t border-zinc-200 px-3 py-2 text-xs text-zinc-500">
            Corrija essas linhas na planilha e envie de novo — os contatos que
            já entraram serão ignorados.
          </p>
        </div>
      )}

      {!rodando && (
        <div className="mt-5 flex gap-2">
          <Link
            href="/lead?view=kanban"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Ver no funil
          </Link>

          <Link
            href="/lead/import"
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
          >
            Importar outra planilha
          </Link>
        </div>
      )}
    </div>
  )
}
