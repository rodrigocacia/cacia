import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '@/auth/decorators/public.decorator';
import { WahaWebhookService } from './waha-webhook.service';
import { JuditWebhookService, type EventoJudit } from './judit-webhook.service';
import { ConsultaWebhookDto, type EventoWahaDto } from './dto/waha-webhook.dto';

/**
 * Endpoints chamados pelos provedores externos.
 *
 * São públicos quanto ao JWT — o WAHA não tem sessão de usuário —, mas exigem
 * o token compartilhado no cabeçalho. Sem isso, qualquer um poderia injetar
 * mensagens falsas no atendimento de um escritório.
 */
@Public()
@Controller('webhooks')
export class WebhooksController {
  private readonly token: string;

  constructor(
    private readonly wahaWebhook: WahaWebhookService,
    private readonly juditWebhook: JuditWebhookService,
    config: ConfigService,
  ) {
    this.token = config.getOrThrow<string>('CACIA_TOOL_API_KEY');
  }

  @Post('waha')
  @HttpCode(HttpStatus.OK)
  async waha(
    @Query() consulta: ConsultaWebhookDto,
    @Headers('x-webhook-token') token: string | undefined,
    @Body() evento: EventoWahaDto,
  ): Promise<{ received: true }> {
    this.conferirToken(token);

    await this.wahaWebhook.processar(consulta.office_id, evento);

    // Sempre 200: erro faria o WAHA reenviar e duplicar a mensagem
    return { received: true };
  }

  /**
   * Atualizações processuais da Judit.
   *
   * Chega tanto da consulta pontual do cadastro quanto do monitoramento
   * contínuo — este último é a novidade: antes, movimentação posterior ao
   * cadastro nunca chegava.
   */
  @Post('judit')
  @HttpCode(HttpStatus.OK)
  async judit(
    @Headers('x-webhook-token') token: string | undefined,
    @Body() evento: EventoJudit,
  ): Promise<{ received: true }> {
    this.conferirToken(token);

    await this.juditWebhook.processar(evento);

    return { received: true };
  }

  private conferirToken(recebido: string | undefined): void {
    if (!recebido || recebido !== this.token) {
      throw new ForbiddenException('Token de webhook inválido');
    }
  }
}
