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
        <p className="text-[13.5px] text-tinta-2">
          <strong>{previa.fileName}</strong> · {previa.totalRows} linha(s)
        </p>

        <button
          type="button"
          onClick={onVoltar}
          className="cursor-pointer text-xs text-tinta-3 underline hover:text-tinta"
        >
          trocar arquivo
        </button>
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-filete bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-filete bg-papel text-left">
            <tr>
              <th className="rotulo px-4 py-2.5 font-normal">
                Coluna do arquivo
              </th>
              <th className="rotulo px-4 py-2.5 font-normal">Exemplo</th>
              <th className="rotulo px-4 py-2.5 font-normal">Vai para</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F1EEE8]">
            {(previa.columns ?? []).map((coluna) => {
              const atual = mapeamento[String(coluna.index)] ?? ""

              return (
                <tr key={coluna.index}>
                  <td className="px-4 py-2.5 font-medium text-tinta">
                    {coluna.header}
                  </td>

                  <td className="max-w-48 truncate px-4 py-2.5 text-tinta-3">
                    {coluna.amostra[0] ?? "—"}
                  </td>

                  <td className="px-4 py-2">
                    <select
                      value={atual}
                      onChange={(evento) =>
                        definirCampo(coluna.index, evento.target.value)
                      }
                      className="h-9 w-full rounded-[9px] border border-filete-forte bg-white px-2.5 text-[13.5px] text-tinta outline-none focus:border-acao focus:shadow-[0_0_0_3px_#D7EBEE]"
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
        <p className="mt-3 rounded-xl bg-ambar-fundo px-4 py-3 text-sm text-ambar">
          Indique qual coluna tem o telefone. Sem ele não há como falar com a
          pessoa nem como saber se ela já está na base.
        </p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-[13px] font-medium text-tinta-2">
            Etapa de entrada
          </label>

          <select
            value={stageId}
            onChange={(evento) => setStageId(evento.target.value)}
            className="mt-1.5 h-9 w-full rounded-[9px] border border-filete-forte bg-white px-2.5 text-[13.5px] text-tinta outline-none focus:border-acao focus:shadow-[0_0_0_3px_#D7EBEE]"
          >
            {etapas.map((etapa) => (
              <option key={etapa.id} value={etapa.id}>
                {etapa.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[13px] font-medium text-tinta-2">
            Etiquetas para todos os importados
          </label>

          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {etiquetas.length === 0 && (
              <span className="text-xs text-tinta-3">
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
                      ? "ring-2 ring-acao ring-offset-1"
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
        <p className="text-xs text-tinta-3">
          Contatos que já existem na base são ignorados, não duplicados.
        </p>

        <button
          type="button"
          disabled={!temTelefone || ocupado}
          onClick={() =>
            void onConfirmar({ mapping: mapeamento, stageId, tagIds })
          }
          className="flex h-9 cursor-pointer items-center rounded-[9px] bg-acao px-3.5 text-[13.5px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:bg-acao-escura disabled:cursor-not-allowed disabled:opacity-40"
        >
          {ocupado ? "Enviando…" : `Importar ${previa.totalRows} linha(s)`}
        </button>
      </div>
    </div>
  )
}
