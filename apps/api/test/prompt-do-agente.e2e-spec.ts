import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ServiceArea, ServiceValueType } from '@cacia/database';
import { PromptService } from '@/ai/agente/prompt.service';
import { criarAplicacao, type AplicacaoDeTeste } from './apoio/aplicacao';
import { criarDuasContas, type Conta } from './apoio/contas';

/**
 * O prompt que o agente recebe, montado a partir dos dados reais.
 *
 * O sistema anterior reconstruía 1.264 linhas a cada mensagem, com 7 consultas
 * ao banco por interação. Aqui o bloco do escritório fica 15 minutos em cache —
 * o que traz um risco novo: uma alteração feita pelo escritório demorar a
 * aparecer no atendimento. Estes testes cobrem os dois lados.
 */
describe('prompt do agente (e2e)', () => {
  let aplicacao: AplicacaoDeTeste;
  let prompt: PromptService;
  let a: Conta;
  let b: Conta;

  beforeAll(async () => {
    aplicacao = await criarAplicacao();
    prompt = aplicacao.app.get(PromptService);
    [a, b] = await criarDuasContas(aplicacao.url);
  });

  afterAll(async () => {
    await aplicacao.encerrar();
  });

  describe('conteúdo', () => {
    it('apresenta o escritório pelo nome', async () => {
      const bloco = await prompt.blocoEstatico(a.officeId);

      expect(bloco).toContain('Escritório A');
    });

    it('inclui os serviços cadastrados, com o valor', async () => {
      await aplicacao.prisma.service.create({
        data: {
          officeId: a.officeId,
          title: 'Ação trabalhista',
          description: 'Reclamação contra o empregador',
          area: ServiceArea.LABOR,
          valueType: ServiceValueType.FIXED,
          valueFixed: 2500,
        },
      });

      await prompt.invalidar(a.officeId);
      const bloco = await prompt.blocoEstatico(a.officeId);

      expect(bloco).toContain('Ação trabalhista');
      expect(bloco).toContain('2500');
    });

    it('inclui as perguntas frequentes', async () => {
      await aplicacao.prisma.question.create({
        data: {
          officeId: a.officeId,
          title: 'Vocês atendem aos sábados?',
          description: 'Sim, das 9h às 12h, com hora marcada.',
        },
      });

      await prompt.invalidar(a.officeId);
      const bloco = await prompt.blocoEstatico(a.officeId);

      expect(bloco).toContain('sábados');
      expect(bloco).toContain('hora marcada');
    });

    it('NUNCA traz dados de outro escritório', async () => {
      // Um vazamento aqui seria o pior tipo: o agente contaria a um cliente os
      // serviços e os preços de outro escritório, em texto corrido.
      const bloco = await prompt.blocoEstatico(b.officeId);

      expect(bloco).not.toContain('Ação trabalhista');
      expect(bloco).not.toContain('sábados');
      expect(bloco).not.toContain('Escritório A');
    });
  });

  describe('regras de comportamento', () => {
    const agente = {
      name: 'Ana',
      style: 'Claro e Objetivo',
      greeting: 'Olá!',
    };

    it('proíbe inventar informação jurídica', () => {
      // A regra existe porque a alternativa é o agente afirmar prazo ou valor
      // que não existe — e o escritório responder por isso.
      expect(prompt.blocoDeComportamento(agente)).toContain(
        'Nunca invente informação jurídica',
      );
    });

    it('proíbe prometer resultado de processo', () => {
      expect(prompt.blocoDeComportamento(agente)).toContain(
        'Nunca prometa resultado',
      );
    });

    it('manda acionar atendente quando a pessoa pedir', () => {
      expect(prompt.blocoDeComportamento(agente)).toContain(
        'acione o atendente',
      );
    });

    it('manda consultar dados reais em vez de supor', () => {
      expect(prompt.blocoDeComportamento(agente)).toContain('em vez de supor');
    });

    it('leva o nome e o tom do agente', () => {
      const bloco = prompt.blocoDeComportamento(agente);

      expect(bloco).toContain('Ana');
      expect(bloco).toContain('Claro e Objetivo');
    });
  });

  describe('o cache não pode segurar uma alteração', () => {
    it('mudar a agenda aparece no prompt imediatamente', async () => {
      // O bloco fica 15 minutos em cache. Sem invalidação, quem mudasse o
      // horário de atendimento veria o agente oferecendo o antigo por todo
      // esse tempo — sem nenhum sinal de que algo estava errado.
      const agenda = await a.api.post<{ id: string }>('/calendars', {
        title: 'Atendimento presencial',
        availableDays: [
          {
            day: 'MONDAY',
            available: true,
            startTime: '09:00',
            endTime: '12:00',
          },
        ],
      });

      const antes = await prompt.blocoEstatico(a.officeId);
      expect(antes).toContain('09:00-12:00');

      await a.api.patch(`/calendars/${agenda.corpo.id}`, {
        availableDays: [
          {
            day: 'MONDAY',
            available: true,
            startTime: '14:00',
            endTime: '18:00',
          },
        ],
      });

      const depois = await prompt.blocoEstatico(a.officeId);
      expect(depois).toContain('14:00-18:00');
      expect(depois).not.toContain('09:00-12:00');
    });

    it('excluir a agenda também aparece', async () => {
      const agenda = await a.api.post<{ id: string }>('/calendars', {
        title: 'Plantão de fim de semana',
        availableDays: [
          {
            day: 'SATURDAY',
            available: true,
            startTime: '10:00',
            endTime: '13:00',
          },
        ],
      });

      expect(await prompt.blocoEstatico(a.officeId)).toContain('Plantão');

      await a.api.delete(`/calendars/${agenda.corpo.id}`);

      expect(await prompt.blocoEstatico(a.officeId)).not.toContain('Plantão');
    });

    it('mudar o nome do escritório aparece no prompt', async () => {
      await a.api.patch('/offices/current', {
        name: 'Escritório Rebatizado',
      });

      expect(await prompt.blocoEstatico(a.officeId)).toContain(
        'Escritório Rebatizado',
      );
    });

    it('a invalidação é do escritório que mudou, não de todos', async () => {
      // Invalidar tudo transformaria cada edição em uma rajada de consultas
      // ao banco para os outros escritórios.
      const antes = await prompt.blocoEstatico(b.officeId);

      await a.api.patch('/offices/current', { name: 'Outro nome ainda' });

      expect(await prompt.blocoEstatico(b.officeId)).toBe(antes);
    });
  });

  describe('desempenho', () => {
    it('a segunda montagem vem do cache, sem tocar no banco', async () => {
      // Era o custo do sistema anterior: 7 consultas por mensagem recebida.
      await prompt.invalidar(a.officeId);

      const primeira = await prompt.blocoEstatico(a.officeId);

      // Muda o banco por baixo, sem invalidar: se a segunda leitura refizer as
      // consultas, o texto muda — e o cache não está funcionando.
      await aplicacao.prisma.office.update({
        where: { id: a.officeId },
        data: { name: 'Nome que não deve aparecer ainda' },
      });

      expect(await prompt.blocoEstatico(a.officeId)).toBe(primeira);
    });
  });
});
