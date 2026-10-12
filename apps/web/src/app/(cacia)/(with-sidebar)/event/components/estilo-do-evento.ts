import { EventType } from "@/types/event"

/**
 * Cores dos eventos na direção visual 02: turquesa suave para tudo o que é
 * compromisso e âmbar para prazo — o único tipo que pede atenção por si só.
 * O tipo continua escrito por extenso; a cor não carrega a informação sozinha.
 */
export const ROTULO_DO_TIPO: Record<string, string> = {
  [EventType.HEARING]: "Audiência",
  [EventType.DEADLINE]: "Prazo",
  [EventType.INQUIRY]: "Inquérito",
  [EventType.MEETING]: "Reunião",
  [EventType.SERVICE]: "Atendimento",
  [EventType.COMMITMENT]: "Compromisso",
  [EventType.CALL]: "Ligação",
  [EventType.FOLLOW_UP]: "Retorno",
}

export function ehPrazo(tipo?: string): boolean {
  return tipo === EventType.DEADLINE
}

/** Fundo, filete à esquerda e cor do texto do chip de evento. */
export function corDoEvento(tipo?: string): {
  chip: string
  filete: string
  texto: string
  ponto: string
} {
  return ehPrazo(tipo)
    ? {
        chip: "border-l-ambar-ponto bg-ambar-fundo",
        filete: "border-l-ambar-ponto",
        texto: "text-ambar",
        ponto: "bg-ambar-ponto",
      }
    : {
        chip: "border-l-acao bg-nevoa",
        filete: "border-l-acao",
        texto: "text-turquesa-profundo",
        ponto: "bg-acao",
      }
}
