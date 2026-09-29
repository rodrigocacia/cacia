import { IsOptional, IsString, IsUUID } from 'class-validator';

export interface PayloadMensagemWaha {
  id: string;
  timestamp: number;
  from: string;
  /** Destinatário: é o contato quando `fromMe`. */
  to?: string;
  fromMe: boolean;
  body?: string;
  caption?: string;
  hasMedia?: boolean;
  notifyName?: string;
  participant?: string;
  media?: { url?: string; mimetype?: string; filename?: string };
  status?: string;
  /**
   * Só em `message.ack`: -1 erro, 0 pendente, 1 no servidor, 2 no aparelho do
   * contato, 3 lida, 4 ouvida.
   */
  ack?: number;
}

export interface EventoWahaDto {
  event: string;
  session: string;
  payload?: PayloadMensagemWaha;
  me?: { id: string; pushName: string };
}

export class ConsultaWebhookDto {
  @IsUUID() office_id!: string;
}

export class CabecalhoWebhookDto {
  @IsOptional() @IsString() 'x-webhook-token'?: string;
}
