import { IsOptional, IsString, IsUUID } from 'class-validator';

export interface PayloadMensagemWaha {
  id: string;
  timestamp: number;
  from: string;
  fromMe: boolean;
  body?: string;
  caption?: string;
  hasMedia?: boolean;
  notifyName?: string;
  participant?: string;
  media?: { url?: string; mimetype?: string; filename?: string };
  status?: string;
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
