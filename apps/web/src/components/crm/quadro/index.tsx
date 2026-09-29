"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { StageKind } from "@cacia/contracts"

import { mensagemDoErro } from "@/http/api-crm"
import { moverEtapa } from "@/http/crm/leads"
import type { Cartao, Quadro } from "@/http/crm/tipos"
import { Toast } from "@/components/ui/toast"
import { Spinner } from "@/components/ui/sppiner"

import { CartaoDoLead } from "./cartao"
import { ColunaDoQuadro } from "./coluna"
import { DialogMotivoDaPerda } from "./dialog-motivo-da-perda"

interface Aviso {
  titulo: string
  descricao: string
  variante: "success" | "error"
}

export function QuadroDoFunil({
  quadro,
  isLoading,
  recarregar,
}: {
  quadro: Quadro | null
  isLoading: boolean
  recarregar: () => Promise<unknown>
}) {
  const router = useRouter()

  const [arrastando, setArrastando] = useState<Cartao | null>(null)
  const [perda, setPerda] = useState<{
    leadId: string
    stageId: string
  } | null>(null)
  const [aviso, setAviso] = useState<Aviso | null>(null)

  // Um limiar de arrasto: sem ele, o clique para abrir a ficha é interpretado
  // como início de arrasto e o cartão nunca abre.
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const etapaPorCartao = useMemo(() => {
    const mapa = new Map<string, string>()

    for (const coluna of quadro?.stages ?? []) {
      for (const cartao of coluna.leads) mapa.set(cartao.id, coluna.id)
    }

    return mapa
  }, [quadro])

  function aoIniciar(evento: DragStartEvent): void {
    const id = String(evento.active.id)
    const cartao = quadro?.stages
      .flatMap((c) => c.leads)
      .find((l) => l.id === id)

    setArrastando(cartao ?? null)
  }

  async function mover(
    leadId: string,
    stageId: string,
    motivo?: string
  ): Promise<void> {
    try {
      await moverEtapa(leadId, stageId, motivo)
      await recarregar()
    } catch (erro) {
      setAviso({
        titulo: "Não foi possível mover",
        descricao: await mensagemDoErro(erro),
        variante: "error",
      })
      // Recarrega mesmo na falha: o cartão precisa voltar para onde estava de
      // verdade, e não para onde a tela achava que estava.
      await recarregar()
    }
  }

  async function aoSoltar(evento: DragEndEvent): Promise<void> {
    setArrastando(null)

    const { active, over } = evento

    if (!over) return

    const leadId = String(active.id)
    const alvo = String(over.id)

    // Soltar sobre outro cartão significa a coluna DELE: o dnd-kit reporta o
    // item mais próximo, que nem sempre é a coluna.
    const destino = quadro?.stages.some((c) => c.id === alvo)
      ? alvo
      : etapaPorCartao.get(alvo)

    if (!destino) return
    if (etapaPorCartao.get(leadId) === destino) return

    const coluna = quadro?.stages.find((c) => c.id === destino)

    // A API exige motivo para etapa de perda. Perguntar aqui evita um 400 que
    // a pessoa leria como "o sistema não deixou mover".
    if (coluna?.kind === StageKind.LOST) {
      setPerda({ leadId, stageId: destino })
      return
    }

    await mover(leadId, destino)
  }

  if (isLoading && !quadro) return <Spinner />

  if (!quadro) {
    return (
      <p className="py-12 text-center text-sm text-zinc-500">
        Não foi possível carregar o funil.
      </p>
    )
  }

  return (
    <>
      <DndContext
        sensors={sensores}
        collisionDetection={closestCorners}
        onDragStart={aoIniciar}
        onDragEnd={(evento) => void aoSoltar(evento)}
        onDragCancel={() => setArrastando(null)}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {quadro.stages.map((coluna) => (
            <ColunaDoQuadro
              key={coluna.id}
              coluna={coluna}
              onAbrir={(id) => router.push(`/lead/${id}`)}
            />
          ))}
        </div>

        {/* O cartão segue o cursor; sem isto ele "desaparece" durante o arrasto */}
        <DragOverlay>
          {arrastando && (
            <CartaoDoLead cartao={arrastando} onAbrir={() => undefined} />
          )}
        </DragOverlay>
      </DndContext>

      {perda && (
        <DialogMotivoDaPerda
          onCancelar={() => {
            setPerda(null)
            void recarregar()
          }}
          onConfirmar={async (motivo) => {
            const pedido = perda
            setPerda(null)
            await mover(pedido.leadId, pedido.stageId, motivo)
          }}
        />
      )}

      {aviso && (
        <Toast
          title={aviso.titulo}
          description={aviso.descricao}
          variant={aviso.variante}
          onClose={() => setAviso(null)}
        />
      )}
    </>
  )
}
