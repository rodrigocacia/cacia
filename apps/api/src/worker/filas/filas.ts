import type { MessageType } from '@cacia/database';

/**
 * Nomes das filas.
 *
 * Ficam num arquivo só para que quem publica e quem consome usem exatamente a
 * mesma string — um nome divergente cria uma fila silenciosa que ninguém lê, e
 * o job simplesmente nunca acontece.
 */
export const FILA = {
  ENVIO_WHATSAPP: 'envio-whatsapp',
  LEMBRETES: 'lembretes',
  ATUALIZACAO_PROCESSO: 'atualizacao-processo',
} as const;

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
