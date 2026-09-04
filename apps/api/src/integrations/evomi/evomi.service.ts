import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProxyAgent } from 'undici';
import { ProxyScope } from '@cacia/database';
import { nomeDoEstado } from './estados-br';
import { slugLocalizacao } from './slug-localizacao';

export interface CredenciaisEvomi {
  username: string;
  password: string;
  server: string;
}

export interface LocalizacaoProxy {
  country?: string;
  state?: string;
  city?: string;
}

export interface ProxyResolvido extends CredenciaisEvomi {
  scope: ProxyScope;
  country: string;
  state?: string;
  city?: string;
}

const VALIDADE_CREDENCIAIS_MS = 10 * 60 * 1000;
const URL_SONDAGEM = 'https://ip.evomi.com/s';
const PAIS_PADRAO = 'BR';

@Injectable()
export class EvomiService {
  private readonly logger = new Logger(EvomiService.name);
  private readonly apiKey: string;
  private readonly produto: string;

  private cache: { valor: CredenciaisEvomi; buscadoEm: number } | null = null;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('EVOMI_API_KEY') ?? '';
    // Divergência do sistema anterior: o código usava 'rp' como padrão e o
    // .env.example dizia 'rpc'. Unificado em 'rpc' (Core Residential).
    this.produto = this.config.get<string>('EVOMI_PRODUCT') ?? 'rpc';

    if (!this.apiKey) {
      this.logger.warn(
        'EVOMI_API_KEY ausente — as sessões vão operar sem proxy residencial',
      );
    }
  }

  estaConfigurado(): boolean {
    return this.apiKey !== '';
  }

  async obterCredenciais(): Promise<CredenciaisEvomi> {
    if (
      this.cache &&
      Date.now() - this.cache.buscadoEm < VALIDADE_CREDENCIAIS_MS
    ) {
      return this.cache.valor;
    }

    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        'Evomi não está configurado. Verifique EVOMI_API_KEY',
      );
    }

    const resposta = await fetch('https://api.evomi.com/public', {
      headers: { 'x-apikey': this.apiKey },
      signal: AbortSignal.timeout(15_000),
    });

    if (!resposta.ok) {
      throw new HttpException(
        'Erro ao obter credenciais da Evomi',
        resposta.status,
      );
    }

    const dados = (await resposta.json()) as {
      products?: Record<
        string,
        {
          username?: string;
          password?: string;
          endpoint?: string;
          ports?: { http?: number };
        }
      >;
    };

    const produto = dados.products?.[this.produto];

    if (!produto?.username || !produto.password || !produto.endpoint) {
      throw new ServiceUnavailableException(
        `Produto Evomi "${this.produto}" indisponível para esta conta`,
      );
    }

    const credenciais: CredenciaisEvomi = {
      username: produto.username,
      password: produto.password,
      server: `${produto.endpoint}:${produto.ports?.http ?? 1000}`,
    };

    this.cache = { valor: credenciais, buscadoEm: Date.now() };

    return credenciais;
  }

  /**
   * Resolve o proxy mais específico que de fato funciona.
   *
   * A API da Evomi não valida cidade nem estado ao montar a senha — ela aceita
   * qualquer string e só falha na hora de usar o proxy. Por isso cada nível é
   * testado de verdade, com uma requisição, antes de ser aceito.
   *
   * A cascata é cidade → estado → país: um escritório do interior que não tenha
   * saída na própria cidade ainda sai pelo estado, o que é bem melhor do que
   * sair pelo datacenter.
   */
  async resolverParaLocalizacao(
    local: LocalizacaoProxy,
  ): Promise<ProxyResolvido> {
    const credenciais = await this.obterCredenciais();
    const pais = local.country ?? PAIS_PADRAO;
    const estado =
      local.state && pais === PAIS_PADRAO
        ? nomeDoEstado(local.state)
        : local.state;

    const candidatos: { escopo: ProxyScope; local: LocalizacaoProxy }[] = [];

    if (local.city) {
      candidatos.push({
        escopo: ProxyScope.CITY,
        local: { country: pais, state: estado, city: local.city },
      });
    }
    if (estado) {
      candidatos.push({
        escopo: ProxyScope.STATE,
        local: { country: pais, state: estado },
      });
    }
    candidatos.push({ escopo: ProxyScope.COUNTRY, local: { country: pais } });

    for (const candidato of candidatos) {
      const senha = this.montarSenha(credenciais.password, candidato.local);

      if (await this.sondar(credenciais, senha)) {
        if (candidato.escopo !== candidatos[0]?.escopo) {
          this.logger.warn(
            `Proxy indisponível no nível mais específico; usando "${candidato.escopo}"`,
          );
        }

        return {
          server: credenciais.server,
          username: credenciais.username,
          password: senha,
          scope: candidato.escopo,
          country: pais,
          state: candidato.local.state,
          city: candidato.local.city,
        };
      }
    }

    throw new ServiceUnavailableException(
      'Nenhum proxy Evomi disponível, nem no nível de país',
    );
  }

  /** A localização vai codificada na senha — é como a Evomi faz geo-targeting. */
  private montarSenha(base: string, local: LocalizacaoProxy): string {
    let senha = base;

    if (local.country) senha += `_country-${local.country.toUpperCase()}`;
    if (local.state) senha += `_region-${slugLocalizacao(local.state)}`;
    if (local.city) senha += `_city-${slugLocalizacao(local.city)}`;

    return senha;
  }

  private async sondar(
    credenciais: CredenciaisEvomi,
    senha: string,
  ): Promise<boolean> {
    const url = `http://${encodeURIComponent(credenciais.username)}:${encodeURIComponent(senha)}@${credenciais.server}`;

    // O fetch nativo do Node NÃO aceita a opção `agent` — ela é silenciosamente
    // ignorada, e a sondagem passaria direto, sem proxy nenhum, dando um falso
    // positivo. O caminho correto é o dispatcher do undici.
    const dispatcher = new ProxyAgent(url);

    try {
      const resposta = await fetch(URL_SONDAGEM, {
        dispatcher,
        signal: AbortSignal.timeout(12_000),
      } as RequestInit & { dispatcher: ProxyAgent });

      return resposta.status === HttpStatus.OK;
    } catch (erro) {
      this.logger.warn(
        `Sondagem de proxy falhou: ${erro instanceof Error ? erro.message : 'erro'}`,
      );
      return false;
    } finally {
      await dispatcher.close().catch(() => undefined);
    }
  }
}
