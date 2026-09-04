import { describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { ProxyScope } from '@cacia/database';
import { ConnectionsService } from './connections.service';
import type { PrismaService } from '@/infra/prisma/prisma.service';
import type { EvomiService } from '@/integrations/evomi/evomi.service';
import type { WahaService } from '@/integrations/waha/waha.service';

/**
 * O achado crítico do diagnóstico: no sistema anterior a sessão de WhatsApp
 * nascia SEM proxy residencial. A integração com a Evomi existia e funcionava,
 * mas só era acionada se um operador configurasse manualmente no painel — o que
 * quase nunca acontecia. Todo número novo operava pelo IP do datacenter, que é
 * exatamente o cenário de bloqueio pela Meta que o proxy evita.
 */

const ESCRITORIO = 'aaaaaaaa-0000-0000-0000-000000000001';

const PROXY_RESOLVIDO = {
  server: 'proxy.evomi.com:1000',
  username: 'usuario',
  password: 'senha_country-BR_region-sao.paulo',
  scope: ProxyScope.STATE,
  country: 'BR',
  state: 'São Paulo',
  city: undefined,
};

function montar(opcoes: {
  evomiConfigurado?: boolean;
  evomiFalha?: boolean;
  enderecoEscritorio?: { state: string; city: string } | null;
}) {
  const criarSessao = vi
    .fn()
    .mockResolvedValue({ name: 's', status: 'STARTING' });
  const waha = {
    criarSessao,
    configPadrao: () => ({ apiUrl: 'https://waha.local', apiKey: 'chave' }),
    trocarProxy: vi.fn(),
  } as unknown as WahaService;

  const resolverParaLocalizacao = opcoes.evomiFalha
    ? vi.fn().mockRejectedValue(new Error('sem saída disponível'))
    : vi.fn().mockResolvedValue(PROXY_RESOLVIDO);

  const evomi = {
    estaConfigurado: () => opcoes.evomiConfigurado ?? true,
    resolverParaLocalizacao,
  } as unknown as EvomiService;

  const create = vi.fn().mockResolvedValue({ id: 'conexao-1' });
  const prisma = {
    office: {
      findUniqueOrThrow: vi.fn().mockResolvedValue({
        name: 'Escritório',
        addresses: opcoes.enderecoEscritorio ? [opcoes.enderecoEscritorio] : [],
      }),
    },
    connection: {
      create,
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  } as unknown as PrismaService;

  const config = {
    getOrThrow: () => 'https://api.cacia.ai',
  } as unknown as ConfigService;

  return {
    servico: new ConnectionsService(prisma, config, waha, evomi),
    criarSessao,
    resolverParaLocalizacao,
    create,
  };
}

function dadosGravados(create: ReturnType<typeof vi.fn>) {
  return (create.mock.calls[0]?.[0] as { data: Record<string, unknown> }).data;
}

describe('ConnectionsService — proxy na criação da sessão', () => {
  it('passa o proxy JÁ no payload de criação da sessão', async () => {
    const { servico, criarSessao } = montar({});

    await servico.criar(ESCRITORIO, {});

    const [, opcoes] = criarSessao.mock.calls[0] as [
      string,
      { proxy?: { server: string; username: string; password: string } },
    ];

    expect(opcoes.proxy).toEqual({
      server: PROXY_RESOLVIDO.server,
      username: PROXY_RESOLVIDO.username,
      password: PROXY_RESOLVIDO.password,
    });
  });

  it('registra proxyAppliedAt, para a conexão não constar como pendente', async () => {
    const { servico, create } = montar({});

    await servico.criar(ESCRITORIO, {});

    const dados = dadosGravados(create);
    expect(dados.proxyAppliedAt).toBeInstanceOf(Date);
    expect(dados.proxyScope).toBe(ProxyScope.STATE);
  });

  it('usa o endereço do escritório quando a localização não é informada', async () => {
    // O número deve parecer estar onde o escritório está
    const { servico, resolverParaLocalizacao } = montar({
      enderecoEscritorio: { state: 'RJ', city: 'Niterói' },
    });

    await servico.criar(ESCRITORIO, {});

    expect(resolverParaLocalizacao).toHaveBeenCalledWith({
      state: 'RJ',
      city: 'Niterói',
    });
  });

  it('a localização informada tem prioridade sobre o endereço', async () => {
    const { servico, resolverParaLocalizacao } = montar({
      enderecoEscritorio: { state: 'RJ', city: 'Niterói' },
    });

    await servico.criar(ESCRITORIO, { proxyState: 'SP', proxyCity: 'Santos' });

    expect(resolverParaLocalizacao).toHaveBeenCalledWith({
      state: 'SP',
      city: 'Santos',
    });
  });

  describe('quando o proxy não pode ser aplicado', () => {
    it('ainda cria a sessão — escritório sem atendimento é pior', async () => {
      const { servico, criarSessao } = montar({ evomiFalha: true });

      await servico.criar(ESCRITORIO, {});

      expect(criarSessao).toHaveBeenCalledOnce();
      const [, opcoes] = criarSessao.mock.calls[0] as [
        string,
        { proxy?: unknown },
      ];
      expect(opcoes.proxy).toBeUndefined();
    });

    it('deixa proxyAppliedAt nulo, para a conexão aparecer como pendente', async () => {
      const { servico, create } = montar({ evomiFalha: true });

      await servico.criar(ESCRITORIO, {});

      expect(dadosGravados(create).proxyAppliedAt).toBeUndefined();
    });

    it('nem tenta resolver quando a Evomi não está configurada', async () => {
      const { servico, resolverParaLocalizacao } = montar({
        evomiConfigurado: false,
      });

      await servico.criar(ESCRITORIO, {});

      expect(resolverParaLocalizacao).not.toHaveBeenCalled();
    });
  });

  describe('listagem de conexões sem proxy', () => {
    it('filtra por proxyAppliedAt nulo dentro do escritório', async () => {
      const findMany = vi.fn().mockResolvedValue([]);
      const prisma = {
        connection: { findMany },
      } as unknown as PrismaService;

      const servico = new ConnectionsService(
        prisma,
        {} as ConfigService,
        {} as WahaService,
        {} as EvomiService,
      );

      await servico.listarSemProxy(ESCRITORIO);

      const where = (
        findMany.mock.calls[0]?.[0] as { where: Record<string, unknown> }
      ).where;
      expect(where.officeId).toBe(ESCRITORIO);
      expect(where.proxyAppliedAt).toBeNull();
    });
  });
});
