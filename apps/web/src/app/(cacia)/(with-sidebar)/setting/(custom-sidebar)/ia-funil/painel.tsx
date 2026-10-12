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

import { Cartao } from "../../_ui/cartao"

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
      "Quando a conversa mostrar que o negócio avançou ou foi descartado, o assistente move o cartão no quadro.",
    aviso:
      "Movimentos feitos pelo assistente aparecem no histórico do lead como “IA de atendimento”, e não como uma pessoa — dá para revisar depois.",
  },
  {
    chave: "aiCanTagLead",
    titulo: "Aplicar etiquetas",
    descricao:
      "O assistente marca o contato com etiquetas já cadastradas, conforme o assunto que a conversa revelar.",
    aviso:
      "Ele nunca cria etiqueta nova: só usa as que existem em Configurações → Etiquetas.",
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
      className={`relative h-6 w-[42px] shrink-0 cursor-pointer rounded-full transition outline-none focus-visible:ring-[3px] focus-visible:ring-nevoa-2 disabled:cursor-not-allowed disabled:opacity-40 ${
        ligado ? "bg-acao" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(21,19,17,0.25)] transition-all ${
          ligado ? "left-[20px]" : "left-0.5"
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
    <Cartao
      titulo="Assistente no funil de vendas"
      descricao="O assistente de atendimento já cria leads a partir das conversas do WhatsApp. Aqui você decide se ele também pode mexer no funil."
    >
      <ul className="flex flex-col">
        {PORTOES.map((portao) => {
          const ligado = data?.[portao.chave] ?? false

          return (
            <li
              key={portao.chave}
              className="flex items-start gap-6 border-t border-[#F1EEE8] py-4 first:border-t-0 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-tinta">
                  {portao.titulo}
                </p>
                <p className="mt-1 text-[13px] text-tinta-2">
                  {portao.descricao}
                </p>
                <p className="mt-1.5 text-[12.5px] text-tinta-3">
                  {portao.aviso}
                </p>
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
    </Cartao>
  )
}
