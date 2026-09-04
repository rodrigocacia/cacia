import type { MessageType } from '@cacia/database';

/**
 * Nomes das filas.
 *
 * Ficam num arquivo só para que quem publica e quem consome usem exatamente a
 * mesma string — um nome divergente cria uma fila silenciosa que ninguém lê, e
 * o job simplesmente nunca acontece.
 */
export const FILA = {
  ATENDIMENTO: 'atendimento',
  ENVIO_WHATSAPP: 'envio-whatsapp',
  LEMBRETES: 'lembretes',
  ATUALIZACAO_PROCESSO: 'atualizacao-processo',
} as const;

/**
 * Uma mensagem chegou e o agente precisa responder.
 *
 * O destinatário e a conexão viajam no job em vez de serem redescobertos pelo
 * worker: quem recebeu o evento sabe por qual sessão a mensagem entrou, e a
 * resposta precisa sair pela MESMA. Um escritório com duas conexões receberia
 * a resposta pelo número errado.
 */
export interface JobAtendimento {
  officeId: string;
  chatId: string;
  connectionId: string;
  para: string;
}

export interface JobEnvioWhatsapp {
  officeId: string;
  connectionId: string;
  para: string;
  tipo: MessageType;
  texto?: string;
  arquivo?: { url: string; mimetype: string; filename: string };
  legenda?: string;
  /** Preenchido quando o envio é resposta em uma conversa. */
  chatId?: string;
}

export interface JobLembrete {
  reminderId: string;
  tentativaAtual: number;
}

export interface JobAtualizacaoProcesso {
  officeId: string;
  processId: string;
  requestId: string;
}
