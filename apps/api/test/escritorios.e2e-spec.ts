import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarAplicacao, type AplicacaoDeTeste } from './apoio/aplicacao';
import { Cliente } from './apoio/cliente';
import { criarConta, type Conta } from './apoio/contas';

describe('escritórios e papéis (e2e)', () => {
  let aplicacao: AplicacaoDeTeste;
  let dono: Conta;
  /** Convidado como USER no escritório do dono. */
  let membro: { token: string; userId: string; api: Cliente };

  beforeAll(async () => {
    aplicacao = await criarAplicacao();
    dono = await criarConta(aplicacao.url, 'Escritório Silva & Associados');

    const convidado = await criarConta(
      aplicacao.url,
      'Escritório do Convidado',
    );

    await dono.api.post('/offices/current/members', {
      email: convidado.email,
      role: 'USER',
    });

    membro = {
      token: convidado.token,
      userId: convidado.userId,
      api: new Cliente(aplicacao.url, {
        token: convidado.token,
        officeId: dono.officeId,
      }),
    };
  });

  afterAll(async () => {
    await aplicacao.encerrar();
  });

  describe('criação', () => {
    it('quem cria vira ADMIN', async () => {
      const resposta = await dono.api
        .semEscritorio()
        .get<{ id: string; role: string }[]>('/offices');

      const proprio = resposta.corpo.find((o) => o.id === dono.officeId);
      expect(proprio?.role).toBe('ADMIN');
    });

    it('cria as configurações junto, na mesma transação', async () => {
      // Sem isso haveria escritório sem configuração, e todo lugar que a lê
      // teria de tratar o caso nulo.
      const setting = await aplicacao.prisma.setting.findUnique({
        where: { officeId: dono.officeId },
        select: { id: true },
      });

      expect(setting).not.toBeNull();
    });

    it('nasce com os agentes de atendimento e assistente', async () => {
      // Sem o de atendimento, a primeira mensagem do WhatsApp não abria
      // conversa — ChatsService recusa sem agente SUPPORT.
      const agentes = await aplicacao.prisma.agent.findMany({
        where: { officeId: dono.officeId, deletedAt: null },
        select: { type: true },
      });

      expect(agentes.map((a) => a.type).sort()).toEqual([
        'PERSONAL',
        'SUPPORT',
      ]);
    });

    it('aceita CPF, para o advogado autônomo', async () => {
      const resposta = await dono.api
        .semEscritorio()
        .post<{ id: string; document: string }>('/offices', {
          name: 'Dra. Autônoma',
          document: '529.982.247-25',
          oabNumber: '777001',
          oabUf: 'SP',
          addresses: [{ cep: '01310-100', city: 'São Paulo', state: 'SP' }],
        });

      expect(resposta.status).toBe(201);
      expect(resposta.corpo.document).toBe('52998224725');

      const enderecos = await aplicacao.prisma.officeAddress.count({
        where: { officeId: resposta.corpo.id },
      });
      expect(enderecos).toBe(1);
    });

    it('recusa CNPJ fora de 14 dígitos', async () => {
      const resposta = await dono.api.semEscritorio().post('/offices', {
        name: 'Curto',
        document: '123',
        oabNumber: '999999',
        oabUf: 'SP',
      });

      expect(resposta.status).toBe(400);
    });

    it('recusa UF que não existe', async () => {
      const resposta = await dono.api.semEscritorio().post('/offices', {
        name: 'UF inválida',
        document: '99999999999999',
        oabNumber: '999998',
        oabUf: 'XX',
      });

      expect(resposta.status).toBe(400);
    });
  });

  describe('endereço e onboarding', () => {
    it('grava o endereço, que é o que escolhe a localização do proxy', async () => {
      // Não é só cadastro: o número de WhatsApp precisa parecer estar onde o
      // escritório está — ver ConnectionsService.criar.
      const resposta = await dono.api.patch('/offices/current', {
        addresses: [
          {
            cep: '01310100',
            street: 'Avenida Paulista',
            number: '1000',
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP',
          },
        ],
      });

      expect(resposta.status).toBe(200);

      const detalhe = await dono.api.get<{
        addresses: { city: string; state: string }[];
      }>('/offices/current');

      expect(detalhe.corpo.addresses[0]?.city).toBe('São Paulo');
      expect(detalhe.corpo.addresses[0]?.state).toBe('SP');
    });

    it('enviar o endereço de novo substitui, não acumula', async () => {
      // A tela manda o endereço inteiro; um merge parcial deixaria o bairro
      // antigo junto da rua nova.
      await dono.api.patch('/offices/current', {
        addresses: [{ city: 'Santos', state: 'SP' }],
      });

      const detalhe = await dono.api.get<{ addresses: unknown[] }>(
        '/offices/current',
      );

      expect(detalhe.corpo.addresses).toHaveLength(1);
    });

    it('conclui o onboarding, e sabe reabri-lo', async () => {
      await dono.api.patch('/offices/current', { onboarding: true });
      expect(
        (await dono.api.get<{ onboarding: boolean }>('/offices/current')).corpo
          .onboarding,
      ).toBe(true);

      await dono.api.patch('/offices/current', { onboarding: false });
      expect(
        (await dono.api.get<{ onboarding: boolean }>('/offices/current')).corpo
          .onboarding,
      ).toBe(false);
    });
  });

  describe('membros', () => {
    it('o convidado passa a ver o escritório na própria lista', async () => {
      const resposta = await membro.api
        .semEscritorio()
        .get<{ id: string; role: string }[]>('/offices');

      const convidado = resposta.corpo.find((o) => o.id === dono.officeId);
      expect(convidado?.role).toBe('USER');
    });

    it('o convidado acessa os dados do escritório', async () => {
      const resposta = await membro.api.get('/customers');

      expect(resposta.status).toBe(200);
    });

    it('a listagem de membros traz os dois, com o papel de cada um', async () => {
      const resposta = await dono.api.get<{ id: string; role: string }[]>(
        '/offices/current/members',
      );

      const papeis = new Map(resposta.corpo.map((m) => [m.id, m.role]));
      expect(papeis.get(dono.userId)).toBe('ADMIN');
      expect(papeis.get(membro.userId)).toBe('USER');
    });

    it('a listagem de membros não expõe a senha', async () => {
      const resposta = await dono.api.get('/offices/current/members');

      expect(JSON.stringify(resposta.corpo)).not.toContain('password');
    });
  });

  describe('papel dentro do escritório', () => {
    it('USER não altera os dados do escritório', async () => {
      const resposta = await membro.api.patch('/offices/current', {
        name: 'Nome trocado por quem não podia',
      });

      expect(resposta.status).toBe(403);
    });

    it('ADMIN altera', async () => {
      const resposta = await dono.api.patch<{ name: string }>(
        '/offices/current',
        { name: 'Silva, Souza & Associados' },
      );

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.name).toBe('Silva, Souza & Associados');
    });

    it('USER não convida ninguém', async () => {
      const resposta = await membro.api.post('/offices/current/members', {
        email: 'qualquer@cacia.test',
        role: 'ADMIN',
      });

      expect(resposta.status).toBe(403);
    });

    it('USER não remove membro', async () => {
      const resposta = await membro.api.delete(
        `/offices/current/members/${dono.userId}`,
      );

      expect(resposta.status).toBe(403);
    });

    it('o papel é por escritório, não global', async () => {
      // A mesma pessoa é USER aqui e ADMIN no escritório que ela criou.
      const proprios = await membro.api
        .semEscritorio()
        .get<{ id: string; role: string }[]>('/offices');

      const papeis = new Set(proprios.corpo.map((o) => o.role));
      expect(papeis).toEqual(new Set(['ADMIN', 'USER']));
    });
  });

  describe('remoção de membro', () => {
    it('ADMIN remove e o acesso cessa na hora', async () => {
      const remocao = await dono.api.delete(
        `/offices/current/members/${membro.userId}`,
      );
      expect(remocao.status).toBe(204);

      const depois = await membro.api.get('/customers');
      expect(depois.status).toBe(403);
    });
  });
});
