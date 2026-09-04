import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ConfigEvolution {
  apiUrl: string;
  apiKey: string;
  instance: string;
}

/**
 * Evolution API — provedor de reserva.
 *
 * Só é acionada quando o WAHA falha em uma conexão com `fallbackEnabled`.
 * O contrato é propositalmente enxuto: apenas o que o fallback precisa.
 */
@Injectable()
export class EvolutionService {
  private readonly logger = new Logger(EvolutionService.name);
  private readonly urlPadrao: string;
  private readonly chavePadrao: string;

  constructor(private readonly config: ConfigService) {
    this.urlPadrao = this.config.get<string>('EVOLUTION_API_URL') ?? '';
    this.chavePadrao = this.config.get<string>('EVOLUTION_API_KEY') ?? '';
  }

  async criarInstancia(
    nome: string,
    webhookUrl: string,
  ): Promise<{ instanceName: string; apiKey: string }> {
    const resposta = await this.chamar<{
      instance: { instanceName: string };
      hash: string;
    }>('POST', '/instance/create', this.chavePadrao, {
      instanceName: nome,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      webhook: {
        url: webhookUrl,
        byEvents: false,
        base64: true,
        events: ['MESSAGES_UPSERT'],
      },
    });

    return {
      instanceName: resposta.instance.instanceName,
      apiKey: resposta.hash,
    };
  }

  enviarTexto(
    config: ConfigEvolution,
    para: string,
    texto: string,
  ): Promise<{ key: { id: string } }> {
    return this.chamar(
      'POST',
      `/message/sendText/${config.instance}`,
      config.apiKey,
      { number: this.normalizarDestino(para), text: texto },
      config.apiUrl,
    );
  }

  enviarMidia(
    config: ConfigEvolution,
    para: string,
    midia: { url: string; tipo: 'image' | 'video' | 'document'; nome?: string },
    legenda?: string,
  ): Promise<{ key: { id: string } }> {
    return this.chamar(
      'POST',
      `/message/sendMedia/${config.instance}`,
      config.apiKey,
      {
        number: this.normalizarDestino(para),
        mediatype: midia.tipo,
        media: midia.url,
        fileName: midia.nome,
        caption: legenda,
      },
      config.apiUrl,
    );
  }

  enviarAudio(
    config: ConfigEvolution,
    para: string,
    url: string,
  ): Promise<{ key: { id: string } }> {
    return this.chamar(
      'POST',
      `/message/sendWhatsAppAudio/${config.instance}`,
      config.apiKey,
      { number: this.normalizarDestino(para), audio: url },
      config.apiUrl,
    );
  }

  private normalizarDestino(destino: string): string {
    return destino.replace(/\D/g, '');
  }

  private async chamar<T>(
    metodo: string,
    caminho: string,
    apiKey: string,
    corpo?: unknown,
    apiUrl = this.urlPadrao,
  ): Promise<T> {
    if (!apiUrl || !apiKey) {
      throw new HttpException('Evolution API não está configurada', 503);
    }

    const resposta = await fetch(`${apiUrl}${caminho}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', apikey: apiKey },
      ...(corpo !== undefined && { body: JSON.stringify(corpo) }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text().catch(() => '');
      this.logger.error(
        `Evolution ${metodo} ${caminho} -> ${resposta.status} ${detalhe}`,
      );
      throw new HttpException(
        `Erro na Evolution API: ${resposta.statusText}`,
        resposta.status,
      );
    }

    return (await resposta.json()) as T;
  }
}
