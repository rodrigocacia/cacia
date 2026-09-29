"use client"

import { useRef, useState } from "react"

import { Icon } from "@/components/icone"

/**
 * O envio do arquivo.
 *
 * Só CSV. Planilha do Excel salva como "CSV UTF-8" ou como "CSV separado por
 * ponto e vírgula" funcionam igual — o servidor descobre o separador e a
 * codificação sozinho, que é onde a maior parte das importações falha.
 */
export function PassoArquivo({
  ocupado,
  onEnviar,
}: {
  ocupado: boolean
  onEnviar: (arquivo: File) => Promise<void>
}) {
  const entrada = useRef<HTMLInputElement>(null)
  const [arrastando, setArrastando] = useState(false)

  function receber(arquivo: File | undefined): void {
    if (!arquivo || ocupado) return
    void onEnviar(arquivo)
  }

  return (
    <div>
      <button
        type="button"
        disabled={ocupado}
        onClick={() => entrada.current?.click()}
        onDragOver={(evento) => {
          evento.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(evento) => {
          evento.preventDefault()
          setArrastando(false)
          receber(evento.dataTransfer.files[0])
        }}
        className={`flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-12 transition ${
          arrastando
            ? "border-zinc-500 bg-zinc-50"
            : "border-zinc-300 hover:border-zinc-400"
        } disabled:opacity-50`}
      >
        <Icon
          icon="mdi:file-upload-outline"
          className="h-8 w-8 text-zinc-400"
        />

        <span className="text-sm font-medium text-zinc-700">
          {ocupado ? "Lendo o arquivo…" : "Clique ou arraste o arquivo CSV"}
        </span>

        <span className="text-xs text-zinc-500">Até 10 MB</span>
      </button>

      <input
        ref={entrada}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(evento) => receber(evento.target.files?.[0])}
      />

      <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600">
        <p className="font-medium text-zinc-700">O que o arquivo precisa ter</p>
        <ul className="mt-1.5 list-inside list-disc space-y-0.5">
          <li>Uma primeira linha com o nome das colunas</li>
          <li>
            Uma coluna com o <strong>telefone</strong> — é o que identifica o
            contato e evita cadastrar a mesma pessoa duas vezes
          </li>
          <li>
            Nome, e-mail, observações e valor são opcionais; linha sem nome
            entra com o telefone no lugar
          </li>
        </ul>
      </div>
    </div>
  )
}
