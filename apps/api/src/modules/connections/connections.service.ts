import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectionStatus,
  ConnectionType,
  WhatsappProvider,
} from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  EvomiService,
  type ProxyResolvido,
} from '@/integrations/evomi/evomi.service';
import { WahaService, type ProxyWaha } from '@/integrations/waha/waha.service';
import type { CriarConexaoDto, TrocarProxyDto } from './dto/connection.dto';

const CAMPOS = {
  id: true,
  type: true,
  provider: true,
  status: true,
  fallbackEnabled: true,
  wahaSession: true,
  wahaState: true,
  wahaPhone: true,
  wahaProfileName: true,
  wahaProfilePictureUrl: true,
  evolutionApiInstance: true,
  evolutionState: true,
  evolutionPhone: true,
  proxyCountry: true,
  proxyState: true,
  proxyCity: true,
  proxyScope: true,
  proxyAppliedAt: true,
  createdAt: true,
} as const;

/**
 * `message.any` no lugar de `message`: além do que chega, avisa o que SAI do
 * número, inclusive o que o advogado digita no próprio celular. Sem isso a
 * tela de conversas mostraria só metade do diálogo. `message.ack` traz a
 * entrega e a leitura.
 */
export const EVENTOS_DO_WEBHOOK = [
  'message.any',
  'message.ack',
  'session.status',
];

@Injectable()
export class ConnectionsService {
  private readonly logger = new Logger(ConnectionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly waha: WahaService,
    private readonly evomi: EvomiService,
  ) {}

  listar(officeId: string) {
    return this.prisma.connection.findMany({
      where: { officeId, deletedAt: null },
      select: CAMPOS,
      orderBy: { createdAt: 'asc' },
    });
  }

  async detalhar(officeId: string, id: string) {
    const conexao = await this.prisma.connection.findFirst({
      where: { id, officeId, deletedAt: null },
      select: CAMPOS,
    });

    if (!conexao) throw new NotFoundException('Conexão não encontrada');

    return conexao;
  }

  /**
   * Cria a conexão de WhatsApp com proxy residencial JÁ APLICADO.
   *
   * Esta é a correção do achado crítico do diagnóstico. No sistema anterior a
   * sessão nascia sem proxy — a integração com a Evomi existia, funcionava e
   * era boa, mas só entrava se um operador abrisse o painel e configurasse
   * manualmente naquela conexão. Na prática, quase nunca acontecia, e todo
   * número novo operava pelo IP do datacenter: exatamente o cenário de bloqueio
   * pela Meta que o proxy existe para evitar.
   *
   * Agora o proxy é resolvido antes de criar a sessão e vai junto no payload.
   * Se a Evomi estiver indisponível, a sessão é criada mesmo assim e o fato
   * fica registrado — melhor um número operando sem proxy do que um escritório
   * sem atendimento —, mas `proxyAppliedAt` fica nulo e a conexão aparece na
   * listagem de pendências.
   */
  async criar(officeId: string, dto: CriarConexaoDto) {
    const escritorio = await this.prisma.office.findUniqueOrThrow({
      where: { id: officeId },
      select: {
        name: true,
        addresses: { select: { state: true, city: true }, take: 1 },
      },
    });

    const nomeSessao = `office-${officeId}`;
    const endereco = escritorio.addresses[0];

    const proxy = await this.resolverProxy({
      state: dto.proxyState ?? endereco?.state ?? undefined,
      city: dto.proxyCity ?? endereco?.city ?? undefined,
    });

    const webhookUrl = `${this.config.getOrThrow<string>('APP_WEBHOOK_URL')}/webhooks/waha?office_id=${officeId}`;

    await this.waha.criarSessao(nomeSessao, {
      webhook: { url: webhookUrl, events: EVENTOS_DO_WEBHOOK },
      proxy: proxy ? this.paraProxyWaha(proxy) : undefined,
    });

    return this.prisma.connection.create({
      data: {
        officeId,
        type: ConnectionType.WHATSAPP,
        provider: WhatsappProvider.WAHA,
        status: ConnectionStatus.PENDING,
        fallbackEnabled: dto.fallbackEnabled ?? true,
        wahaSession: nomeSessao,
        wahaApiHost: this.waha.configPadrao().apiUrl,
        wahaApiKey: this.waha.configPadrao().apiKey,
        ...(proxy && {
          proxyCountry: proxy.country,
          proxyState: proxy.state,
          proxyCity: proxy.city,
          proxyScope: proxy.scope,
          proxyAppliedAt: new Date(),
        }),
      },
      select: CAMPOS,
    });
  }

  /** QR Code para parear o número. */
  async obterQrCode(officeId: string, id: string) {
    const conexao = await this.buscarComCredenciais(officeId, id);

    return this.waha.obterQrCode(conexao.wahaSession!, {
      apiUrl: conexao.wahaApiHost!,
      apiKey: conexao.wahaApiKey!,
    });
  }

  /** Troca a localização do proxy de uma conexão já existente. */
  async trocarProxy(officeId: string, id: string, dto: TrocarProxyDto) {
    const conexao = await this.buscarComCredenciais(officeId, id);

    const proxy = await this.evomi.resolverParaLocalizacao({
      state: dto.state,
      city: dto.city,
    });

    await this.waha.trocarProxy(
      conexao.wahaSession!,
      this.paraProxyWaha(proxy),
      {
        apiUrl: conexao.wahaApiHost!,
        apiKey: conexao.wahaApiKey!,
      },
    );

    return this.prisma.connection.update({
      where: { id },
      data: {
        proxyCountry: proxy.country,
        proxyState: proxy.state,
        proxyCity: proxy.city,
        proxyScope: proxy.scope,
        proxyAppliedAt: new Date(),
      },
      select: CAMPOS,
    });
  }

  /**
   * Conexões operando sem proxy residencial.
   *
   * Existe para tornar visível o problema que antes era silencioso: uma conexão
   * sem proxy só se descobria quando o número era bloqueado.
   */
  listarSemProxy(officeId: string) {
    return this.prisma.connection.findMany({
      where: {
        officeId,
        deletedAt: null,
        provider: WhatsappProvider.WAHA,
        proxyAppliedAt: null,
      },
      select: { id: true, wahaSession: true, wahaPhone: true, createdAt: true },
    });
  }

  async desconectar(officeId: string, id: string): Promise<void> {
    const conexao = await this.buscarComCredenciais(officeId, id);

    await this.waha
      .encerrarSessao(conexao.wahaSession!, {
        apiUrl: conexao.wahaApiHost!,
        apiKey: conexao.wahaApiKey!,
      })
      .catch((erro: Error) => {
        this.logger.warn(`Falha ao encerrar sessão no WAHA: ${erro.message}`);
      });

    await this.prisma.connection.update({
      where: { id },
      data: { status: ConnectionStatus.DISCONNECTED },
    });
  }

  private async resolverProxy(local: {
    state?: string;
    city?: string;
  }): Promise<ProxyResolvido | null> {
    if (!this.evomi.estaConfigurado()) {
      this.logger.warn(
        'Evomi não configurado — a sessão será criada sem proxy residencial',
      );
      return null;
    }

    try {
      return await this.evomi.resolverParaLocalizacao(local);
    } catch (erro) {
      // Não impede a criação: um escritório sem atendimento é pior que um
      // número sem proxy. Mas fica registrado e aparece em /connections/no-proxy.
      this.logger.error(
        `Proxy Evomi indisponível; sessão criada sem ele: ${
          erro instanceof Error ? erro.message : 'erro'
        }`,
      );
      return null;
    }
  }

  private paraProxyWaha(proxy: ProxyResolvido): ProxyWaha {
    return {
      server: proxy.server,
      username: proxy.username,
      password: proxy.password,
    };
  }

  private async buscarComCredenciais(officeId: string, id: string) {
    const conexao = await this.prisma.connection.findFirst({
      where: { id, officeId, deletedAt: null },
      select: {
        id: true,
        wahaSession: true,
        wahaApiHost: true,
        wahaApiKey: true,
      },
    });

    if (!conexao) throw new NotFoundException('Conexão não encontrada');

    if (!conexao.wahaSession || !conexao.wahaApiHost || !conexao.wahaApiKey) {
      throw new NotFoundException('Conexão sem configuração do Provedor 1');
    }

    return conexao;
  }
}
