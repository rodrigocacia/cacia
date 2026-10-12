"use client"

import { useRef, useState } from "react"

import { Upload } from "lucide-react"

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
        className={`flex w-full cursor-pointer flex-col items-center gap-2.5 rounded-[14px] border border-dashed bg-white px-6 py-12 transition ${
          arrastando
            ? "border-acao bg-nevoa"
            : "border-filete-forte hover:border-acao"
        } disabled:opacity-50`}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-nevoa text-turquesa-profundo">
          <Upload size={20} strokeWidth={1.7} />
        </span>

        <span className="text-[14px] font-medium text-tinta">
          {ocupado ? "Lendo o arquivo…" : "Clique ou arraste o arquivo CSV"}
        </span>

        <span className="text-xs text-tinta-3">Até 10 MB</span>
      </button>

      <input
        ref={entrada}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(evento) => receber(evento.target.files?.[0])}
      />

      <div className="mt-4 rounded-[14px] border border-filete bg-white px-5 py-4 text-[13px] text-tinta-2">
        <p className="rotulo">O que o arquivo precisa ter</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
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
