import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import type { PassagemDeEtapa } from "@/http/crm/tipos"

/** Segundos em algo que se lê — "3 dias", "5 h", "12 min". */
export function duracao(segundos: number | null): string | null {
  if (segundos === null) return null

  if (segundos < 60) return "menos de 1 min"

  const minutos = Math.round(segundos / 60)
  if (minutos < 60) return `${minutos} min`

  const horas = Math.round(minutos / 60)
  if (horas < 24) return `${horas} h`

  const dias = Math.round(horas / 24)
  return dias === 1 ? "1 dia" : `${dias} dias`
}

/**
 * Por onde o lead passou.
 *
 * O tempo em cada etapa vem gravado na passagem, não calculado aqui: é o que
 * permite responder "quanto tempo os leads ficam parados na proposta" mesmo
 * depois de eles saírem de lá.
 */
export function LinhaDoTempo({ passagens }: { passagens: PassagemDeEtapa[] }) {
  if (passagens.length === 0) {
    return (
      <p className="text-sm text-zinc-500">Nenhuma movimentação registrada.</p>
    )
  }

  return (
    <ol className="space-y-3">
      {passagens.map((passagem) => {
        const tempo = duracao(passagem.secondsInPreviousStage)

        return (
          <li key={passagem.id} className="flex gap-3">
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: passagem.toStage.color }}
              aria-hidden
            />

            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-800">
                {passagem.fromStage ? (
                  <>
                    <span className="text-zinc-500">
                      {passagem.fromStage.name}
                    </span>{" "}
                    → <strong>{passagem.toStage.name}</strong>
                  </>
                ) : (
                  <>
                    Entrou em <strong>{passagem.toStage.name}</strong>
                  </>
                )}
              </p>

              <p className="text-xs text-zinc-500">
                {format(new Date(passagem.createdAt), "dd 'de' MMM',' HH:mm", {
                  locale: ptBR,
                })}

                {/* Sem usuário significa que foi o agente — a distinção
                    importa para quem olha o quadro e não reconhece o
                    movimento. */}
                {" · "}
                {passagem.user ? passagem.user.name : "IA de atendimento"}

                {tempo && ` · ficou ${tempo} na etapa anterior`}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
