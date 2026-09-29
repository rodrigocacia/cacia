"use client"

import { useState } from "react"
import useSWR from "swr"

import { Spinner } from "@/components/ui/sppiner"
import { Toast } from "@/components/ui/toast"
import { mensagemDoErro } from "@/http/api-crm"
import {
  atualizarConfiguracao,
  obterConfiguracao,
  type ConfiguracaoDoEscritorio,
} from "@/http/crm/configuracoes"

type Chave = "aiCanMoveLeadStage" | "aiCanTagLead"

const PORTOES: Array<{
  chave: Chave
  titulo: string
  descricao: string
  aviso: string
}> = [
  {
    chave: "aiCanMoveLeadStage",
    titulo: "Mover o lead de etapa",
    descricao:
      "Quando a conversa mostrar que o negócio avançou ou foi descartado, a IA move o cartão no quadro.",
    aviso:
      "Movimentos feitos pela IA aparecem no histórico do lead como “IA de atendimento”, e não como uma pessoa — dá para revisar depois.",
  },
  {
    chave: "aiCanTagLead",
    titulo: "Aplicar etiquetas",
    descricao:
      "A IA marca o contato com etiquetas já cadastradas, conforme o assunto que a conversa revelar.",
    aviso:
      "Ela nunca cria etiqueta nova: só usa as que existem em Configurações → Etiquetas.",
  },
]

function Chave({
  ligado,
  onMudar,
  desabilitado,
  rotulo,
}: {
  ligado: boolean
  onMudar: (valor: boolean) => void
  desabilitado: boolean
  rotulo: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      disabled={desabilitado}
      onClick={() => onMudar(!ligado)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-40 ${
        ligado ? "bg-emerald-600" : "bg-zinc-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          ligado ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  )
}

/**
 * O que a IA de atendimento pode fazer no funil.
 *
 * Desligado por padrão, e é decisão do escritório: um cartão que anda sozinho
 * surpreende quem olha o quadro, e quando um lead avançou é julgamento
 * comercial, não técnico.
 */
export function PainelDaIaNoFunil() {
  const { data, isLoading, mutate } = useSWR<ConfiguracaoDoEscritorio>(
    "crm:configuracao",
    obterConfiguracao,
    { revalidateOnFocus: false }
  )

  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState<Chave | null>(null)

  async function alternar(chave: Chave, valor: boolean): Promise<void> {
    setSalvando(chave)
    setErro(null)

    try {
      const atualizada = await atualizarConfiguracao({ [chave]: valor })
      // Substitui o cache pelo que o servidor devolveu, sem revalidar: o PATCH
      // já respondeu com o estado final, e uma segunda leitura só piscaria a
      // chave de volta enquanto chega.
      await mutate(atualizada, { revalidate: false })
    } catch (falha) {
      setErro(
        await mensagemDoErro(
          falha,
          "Não foi possível alterar. Apenas administradores do escritório podem."
        )
      )
    } finally {
      setSalvando(null)
    }
  }

  if (isLoading && !data) return <Spinner />

  return (
    <div className="w-full">
      <h1 className="text-lg font-semibold text-zinc-900">
        I.A. no funil de vendas
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        A IA de atendimento já cria leads a partir das conversas do WhatsApp.
        Aqui você decide se ela também pode mexer no funil.
      </p>

      <ul className="mt-5 space-y-3">
        {PORTOES.map((portao) => {
          const ligado = data?.[portao.chave] ?? false

          return (
            <li
              key={portao.chave}
              className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-800">
                  {portao.titulo}
                </p>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {portao.descricao}
                </p>
                <p className="mt-1.5 text-xs text-zinc-400">{portao.aviso}</p>
              </div>

              <Chave
                ligado={ligado}
                rotulo={portao.titulo}
                desabilitado={salvando !== null}
                onMudar={(valor) => void alternar(portao.chave, valor)}
              />
            </li>
          )
        })}
      </ul>

      {erro && (
        <Toast
          title="Não foi possível alterar"
          description={erro}
          variant="error"
          onClose={() => setErro(null)}
        />
      )}
    </div>
  )
}
