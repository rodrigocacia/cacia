"use client"

import { useState } from "react"
import {
  CAMPOS_IMPORTAVEIS,
  ROTULO_CAMPO_IMPORTAVEL,
  type CampoImportavel,
} from "@cacia/contracts"

import type { Etapa, Etiqueta, Importacao } from "@/http/crm/tipos"

import { EtiquetaBadge } from "../etiqueta"

/**
 * De qual coluna sai cada informação.
 *
 * O servidor abre isto preenchido com o que deduziu dos cabeçalhos, mas quem
 * decide é quem está olhando a planilha: "Contato" pode ser o nome numa
 * empresa e o telefone em outra. Errar aqui custa um clique; importar sem
 * conferir é que custa uma base suja.
 */
export function PassoMapeamento({
  previa,
  etapas,
  etiquetas,
  ocupado,
  onVoltar,
  onConfirmar,
}: {
  previa: Importacao
  etapas: Etapa[]
  etiquetas: Etiqueta[]
  ocupado: boolean
  onVoltar: () => void
  onConfirmar: (dados: {
    mapping: Record<string, string>
    stageId?: string
    tagIds: string[]
  }) => Promise<void>
}) {
  const [mapeamento, setMapeamento] = useState<Record<string, string>>(
    previa.mapping ?? {}
  )
  const [stageId, setStageId] = useState<string>(etapas[0]?.id ?? "")
  const [tagIds, setTagIds] = useState<string[]>([])

  const usados = new Set(Object.values(mapeamento))
  const temTelefone = usados.has("remotejid")

  function definirCampo(indice: number, campo: string): void {
    setMapeamento((atual) => {
      const novo = { ...atual }

      // Um campo por coluna: se este já estava em outra, sai de lá. Duas
      // colunas para "name" fariam a segunda sobrescrever a primeira em
      // silêncio — a API recusa, e aqui a tela evita o erro.
      for (const [chave, valor] of Object.entries(novo)) {
        if (valor === campo) delete novo[chave]
      }

      if (campo) novo[String(indice)] = campo
      else delete novo[String(indice)]

      return novo
    })
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm text-zinc-600">
          <strong>{previa.fileName}</strong> · {previa.totalRows} linha(s)
        </p>

        <button
          type="button"
          onClick={onVoltar}
          className="text-xs text-zinc-500 underline"
        >
          trocar arquivo
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">Coluna do arquivo</th>
              <th className="px-3 py-2 font-medium">Exemplo</th>
              <th className="px-3 py-2 font-medium">Vai para</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100">
            {(previa.columns ?? []).map((coluna) => {
              const atual = mapeamento[String(coluna.index)] ?? ""

              return (
                <tr key={coluna.index}>
                  <td className="px-3 py-2 font-medium text-zinc-800">
                    {coluna.header}
                  </td>

                  <td className="max-w-48 truncate px-3 py-2 text-zinc-500">
                    {coluna.amostra[0] ?? "—"}
                  </td>

                  <td className="px-3 py-2">
                    <select
                      value={atual}
                      onChange={(evento) =>
                        definirCampo(coluna.index, evento.target.value)
                      }
                      className="w-full rounded-md border border-zinc-200 px-2 py-1 text-sm outline-none focus:border-zinc-400"
                    >
                      <option value="">Não importar</option>

                      {CAMPOS_IMPORTAVEIS.map((campo) => (
                        <option
                          key={campo}
                          value={campo}
                          // Já usado em outra coluna: continua selecionável, e
                          // escolher move o campo para cá.
                          disabled={usados.has(campo) && atual !== campo}
                        >
                          {ROTULO_CAMPO_IMPORTAVEL[campo as CampoImportavel]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {!temTelefone && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Indique qual coluna tem o telefone. Sem ele não há como falar com a
          pessoa nem como saber se ela já está na base.
        </p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-zinc-600">
            Etapa de entrada
          </label>

          <select
            value={stageId}
            onChange={(evento) => setStageId(evento.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm outline-none"
          >
            {etapas.map((etapa) => (
              <option key={etapa.id} value={etapa.id}>
                {etapa.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600">
            Etiquetas para todos os importados
          </label>

          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {etiquetas.length === 0 && (
              <span className="text-xs text-zinc-400">
                Nenhuma etiqueta cadastrada
              </span>
            )}

            {etiquetas.map((etiqueta) => {
              const ativa = tagIds.includes(etiqueta.id)

              return (
                <button
                  key={etiqueta.id}
                  type="button"
                  onClick={() =>
                    setTagIds((atuais) =>
                      ativa
                        ? atuais.filter((id) => id !== etiqueta.id)
                        : [...atuais, etiqueta.id]
                    )
                  }
                  className={`rounded-full transition ${
                    ativa
                      ? "ring-2 ring-zinc-900 ring-offset-1"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <EtiquetaBadge etiqueta={etiqueta} />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">
          Contatos que já existem na base são ignorados, não duplicados.
        </p>

        <button
          type="button"
          disabled={!temTelefone || ocupado}
          onClick={() =>
            void onConfirmar({ mapping: mapeamento, stageId, tagIds })
          }
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40"
        >
          {ocupado ? "Enviando…" : `Importar ${previa.totalRows} linha(s)`}
        </button>
      </div>
    </div>
  )
}
