import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ConfigWaha {
  apiUrl: string;
  apiKey: string;
}

export interface ProxyWaha {
  server: string;
  username: string;
  password: string;
}

export interface WebhookWaha {
  url: string;
  events: string[];
}

export interface SessaoWaha {
  name: string;
  status: string;
  config?: Record<string, unknown>;
  me?: { id: string; pushName: string };
}

const EVENTOS_PADRAO = ['message.any', 'message.ack', 'session.status'];

@Injectable()
export class WahaService {
  private readonly logger = new Logger(WahaService.name);
  private readonly padrao: ConfigWaha;

  constructor(private readonly config: ConfigService) {
    this.padrao = {
      apiUrl: this.config.get<string>('WAHA_API_URL') ?? '',
      apiKey: this.config.get<string>('WAHA_API_KEY') ?? '',
    };

    if (!this.padrao.apiUrl || !this.padrao.apiKey) {
      this.logger.warn('WAHA_API_URL ou WAHA_API_KEY ausentes');
    }
  }

  configPadrao(): ConfigWaha {
    return { ...this.padrao };
  }

  /**
   * Cria a sessão.
   *
   * O proxy é passado JÁ na criação — não depois. No sistema anterior a sessão
   * nascia sem proxy e só recebia um se alguém configurasse manualmente no
   * painel, o que raramente acontecia: todo número novo operava pelo IP do
   * datacenter, que é o cenário de bloqueio que o proxy existe para evitar.
   */
  criarSessao(
    nome: string,
    opcoes: { webhook: WebhookWaha; proxy?: ProxyWaha },
    config = this.padrao,
  ): Promise<SessaoWaha> {
    return this.chamar<SessaoWaha>('POST', '/api/sessions', config, {
      name: nome,
      start: true,
      config: {
        webhooks: [
          {
            url: opcoes.webhook.url,
            events: opcoes.webhook.events ?? EVENTOS_PADRAO,
          },
        ],
        ...(opcoes.proxy && { proxy: opcoes.proxy }),
      },
    });
  }

  obterSessao(nome: string, config = this.padrao): Promise<SessaoWaha> {
    return this.chamar<SessaoWaha>('GET', `/api/sessions/${nome}`, config);
  }

  iniciarSessao(nome: string, config = this.padrao): Promise<SessaoWaha> {
    return this.chamar<SessaoWaha>(
      'POST',
      `/api/sessions/${nome}/start`,
      config,
      {},
    );
  }

  pararSessao(nome: string, config = this.padrao): Promise<SessaoWaha> {
    return this.chamar<SessaoWaha>(
      'POST',
      `/api/sessions/${nome}/stop`,
      config,
      {},
    );
  }

  encerrarSessao(nome: string, config = this.padrao): Promise<SessaoWaha> {
    return this.chamar<SessaoWaha>(
      'POST',
      `/api/sessions/${nome}/logout`,
      config,
      {},
    );
  }

  removerSessao(nome: string, config = this.padrao): Promise<void> {
    return this.chamar<void>('DELETE', `/api/sessions/${nome}`, config);
  }

  obterQrCode(nome: string, config = this.padrao): Promise<{ value?: string }> {
    return this.chamar<{ value?: string }>(
      'GET',
      `/api/${nome}/auth/qr`,
      config,
    );
  }

  /**
   * Troca o proxy de uma sessão existente.
   *
   * O WAHA só aplica proxy ao abrir socket novo, então a sessão é reiniciada.
   * É seguro mesmo com ela em WORKING: o WAHA reconecta usando os dados de
   * autenticação já salvos, sem pedir QR de novo.
   */
  async trocarProxy(
    nome: string,
    proxy: ProxyWaha,
    config = this.padrao,
  ): Promise<void> {
    const atual = await this.obterSessao(nome, config);

    await this.chamar('PUT', `/api/sessions/${nome}`, config, {
      config: { ...atual.config, proxy },
    });

    await this.pararSessao(nome, config).catch(() => undefined);
    await this.iniciarSessao(nome, config);
  }

  /**
   * Resolve um @lid para o telefone real.
   *
   * O WhatsApp envia @lid no lugar do número para contatos com privacidade
   * ativa. Precisa ser resolvido ANTES de qualquer uso — o motor GOWS recusa
   * enviar para um @lid, porque não é número válido.
   *
   * Devolve null em vez de lançar: quem chama decide se usa o @lid cru.
   */
  async resolverLid(
    sessao: string,
    lid: string,
    config = this.padrao,
  ): Promise<string | null> {
    try {
      const resposta = await this.chamar<{ lid: string; pn: string }>(
        'GET',
        `/api/${sessao}/lids/${lid.replace('@lid', '')}`,
        config,
      );

      return resposta.pn?.replace('@c.us', '') ?? null;
    } catch {
      return null;
    }
  }

  enviarTexto(
    sessao: string,
    para: string,
    texto: string,
    config = this.padrao,
  ): Promise<{ id: string }> {
    return this.chamar<{ id: string }>('POST', '/api/sendText', config, {
      session: sessao,
      chatId: this.normalizarDestino(para),
      text: texto,
    });
  }

  enviarArquivo(
    sessao: string,
    para: string,
    arquivo: { url: string; mimetype: string; filename: string },
    legenda: string | undefined,
    config = this.padrao,
  ): Promise<{ id: string }> {
    return this.chamar<{ id: string }>('POST', '/api/sendFile', config, {
      session: sessao,
      chatId: this.normalizarDestino(para),
      file: arquivo,
      caption: legenda,
    });
  }

  enviarAudio(
    sessao: string,
    para: string,
    arquivo: { url: string; mimetype: string },
    config = this.padrao,
  ): Promise<{ id: string }> {
    return this.chamar<{ id: string }>('POST', '/api/sendVoice', config, {
      session: sessao,
      chatId: this.normalizarDestino(para),
      file: arquivo,
      // O navegador grava em WebM (Chrome) ou MP4 (Safari); o WhatsApp só
      // toca como mensagem de voz em OGG/Opus. O WAHA converte.
      convert: true,
    });
  }

  /**
   * Baixa a mídia de uma mensagem recebida.
   *
   * O link que vem no evento aponta para o próprio WAHA e exige a chave da
   * API: o navegador não consegue abri-lo, e o WAHA apaga os arquivos depois
   * de um tempo.
   */
  async baixarMidia(url: string, config = this.padrao): Promise<Buffer> {
    const resposta = await fetch(url, {
      headers: { 'X-Api-Key': config.apiKey },
      signal: AbortSignal.timeout(60_000),
    });

    if (!resposta.ok) {
      throw new Error(`Mídia indisponível: ${resposta.status}`);
    }

    return Buffer.from(await resposta.arrayBuffer());
  }

  /** Simula digitação. Falhar aqui não atrapalha o atendimento. */
  async sinalizarDigitando(
    sessao: string,
    para: string,
    digitando: boolean,
    config = this.padrao,
  ): Promise<void> {
    const rota = digitando ? '/api/startTyping' : '/api/stopTyping';

    await this.chamar('POST', rota, config, {
      session: sessao,
      chatId: this.normalizarDestino(para),
    }).catch(() => undefined);
  }

  private normalizarDestino(destino: string): string {
    if (destino.includes('@')) return destino;
    return `${destino.replace(/\D/g, '')}@c.us`;
  }

  private async chamar<T>(
    metodo: string,
    caminho: string,
    config: ConfigWaha,
    corpo?: unknown,
  ): Promise<T> {
    if (!config.apiUrl || !config.apiKey) {
      throw new HttpException('WAHA não está configurado nesta conexão', 503);
    }

    const resposta = await fetch(`${config.apiUrl}${caminho}`, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': config.apiKey,
      },
      ...(corpo !== undefined && { body: JSON.stringify(corpo) }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text().catch(() => '');
      this.logger.error(
        `WAHA ${metodo} ${caminho} -> ${resposta.status} ${detalhe}`,
      );
      throw new HttpException(
        `Erro na API do WAHA: ${resposta.statusText}`,
        resposta.status,
      );
    }

    if (resposta.status === 204) return undefined as T;

    return (await resposta.json()) as T;
  }
}
