"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import clsx from "clsx"
import useSWR from "swr"

import { Icon } from "@/components/icone"
import {
  detalharConversa,
  listarConversas,
  type Conversa,
} from "@/http/crm/conversas"

import { ConversaAberta } from "./conversa-aberta"
import { ListaDeConversas, type Aba } from "./lista"

/**
 * Sem websocket de propósito: consultar a cada poucos segundos é o bastante
 * para um escritório e não exige infraestrutura nova para funcionar em
 * produção.
 */
const INTERVALO_DA_LISTA_MS = 5000

function useAtraso<T>(valor: T, ms: number): T {
  const [atrasado, setAtrasado] = useState(valor)

  useEffect(() => {
    const t = setTimeout(() => setAtrasado(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])

  return atrasado
}

export function CaixaDeConversas() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const idNaUrl = params.get("id")
  const leadId = params.get("leadId")
  const customerId = params.get("customerId")

  const [aba, setAba] = useState<Aba>("todas")
  const [busca, setBusca] = useState("")
  const buscaAtrasada = useAtraso(busca.trim(), 300)

  const filtros = {
    status: aba === "todas" ? undefined : aba,
    search: buscaAtrasada || undefined,
    limit: 50,
  }

  const lista = useSWR(
    ["conversas:lista", filtros.status, filtros.search],
    () => listarConversas(filtros),
    { refreshInterval: INTERVALO_DA_LISTA_MS, keepPreviousData: true }
  )

  // Chegou pela ficha do lead ou do cliente: abre a conversa dele
  const doContato = useSWR(
    !idNaUrl && (leadId || customerId)
      ? ["conversas:do-contato", leadId, customerId]
      : null,
    () =>
      listarConversas({
        leadId: leadId ?? undefined,
        customerId: customerId ?? undefined,
        limit: 1,
      })
  )

  const selecionada = idNaUrl ?? doContato.data?.data[0]?.id ?? null

  // A conversa aberta pode não estar na página atual da lista (outra aba,
  // outra busca); por isso vem da própria rota de detalhe.
  const aberta = useSWR(
    selecionada ? ["conversas:detalhe", selecionada] : null,
    () => detalharConversa(selecionada!),
    { refreshInterval: INTERVALO_DA_LISTA_MS }
  )

  const selecionar = useCallback(
    (id: string | null) => {
      const query = new URLSearchParams()
      if (id) query.set("id", id)
      router.replace(query.size ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    },
    [router, pathname]
  )

  function recarregar() {
    void lista.mutate()
    void aberta.mutate()
  }

  const conversas = lista.data?.data ?? []
  const semConversaDoContato =
    !idNaUrl &&
    (leadId || customerId) &&
    doContato.data &&
    doContato.data.data.length === 0

  return (
    <div className="-mx-8 -mt-6 -mb-12 flex h-[calc(100svh-68px)] min-h-[480px] overflow-hidden max-lg:-mx-4 max-lg:-mb-0 max-lg:h-[calc(100dvh-52px)] md:rounded-b-[14px]">
      <aside
        className={clsx(
          "w-full shrink-0 border-r border-[#ECE8E1] lg:w-[340px]",
          selecionada && "max-lg:hidden"
        )}
      >
        <ListaDeConversas
          conversas={conversas}
          carregando={lista.isLoading}
          selecionada={selecionada}
          aoSelecionar={selecionar}
          aba={aba}
          aoTrocarAba={setAba}
          busca={busca}
          aoBuscar={setBusca}
        />
      </aside>

      <section
        className={clsx("min-w-0 flex-1", !selecionada && "max-lg:hidden")}
      >
        {aberta.data ? (
          <ConversaAberta
            conversa={aberta.data as Conversa}
            aoVoltar={() => selecionar(null)}
            aoMudar={recarregar}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-papel-2 p-6 text-center text-sm text-tinta-3">
            {aberta.error ? (
              <Icon
                icon="mdi:alert-circle-outline"
                className="h-10 w-10 text-zinc-300"
              />
            ) : (
              <Icon
                icon="mdi:forum-outline"
                className="h-10 w-10 text-zinc-300"
              />
            )}
            {aberta.error
              ? "Não foi possível abrir esta conversa."
              : semConversaDoContato
                ? "Este contato ainda não conversou pelo WhatsApp."
                : selecionada
                  ? "Carregando…"
                  : "Escolha uma conversa para ler e responder."}
          </div>
        )}
      </section>
    </div>
  )
}
