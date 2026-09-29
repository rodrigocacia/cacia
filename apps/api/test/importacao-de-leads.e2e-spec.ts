import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Job } from 'bullmq';
import type { StorageService } from '@/infra/storage/storage.service';
import { ImportacaoLeadsProcessor } from '@/worker/processadores/importacao-leads.processor';
import type { JobImportacaoLeads } from '@/worker/filas/filas';
import { criarAplicacao, type AplicacaoDeTeste } from './apoio/aplicacao';
import { criarConta, type Conta } from './apoio/contas';

/**
 * Importação de leads por planilha, do arquivo às linhas no banco.
 *
 * A escrita acontece no worker, não na requisição — cinco mil linhas não cabem
 * no tempo de resposta de quem clicou em confirmar. O teste roda o processador
 * à mão, com o mesmo Prisma e o mesmo storage da aplicação, para cobrir o
 * caminho inteiro em vez de parar na fila.
 */

interface Coluna {
  index: number;
  header: string;
  amostra: string[];
}

interface Importacao {
  id: string;
  fileName: string;
  status: string;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  failedRows: number;
  mapping: Record<string, string> | null;
  errors: Array<{ linha: number; motivo: string }> | null;
  columns?: Coluna[];
  separador?: string;
}

interface Etapa {
  id: string;
  name: string;
}

/**
 * Planilha como o Excel em português a exporta: ponto e vírgula, e um campo
 * com vírgula dentro entre aspas.
 */
const PLANILHA = [
  'Nome;Telefone;E-mail;Observações;Valor',
  'Ana Souza;(11) 98888-1111;ana@exemplo.test;"Indicada por cliente, urgente";1.500,00',
  'Bruno Dias;11988882222;bruno@exemplo.test;;2000',
  'Carla Nunes;11988883333;;Só WhatsApp;',
  ';11988884444;;Sem nome;',
  'Erro Sem Telefone;;;;',
  'Telefone Curto;123;;;',
].join('\n');

describe('importação de leads (e2e)', () => {
  let aplicacao: AplicacaoDeTeste;
  let conta: Conta;
  let etapas: Etapa[];

  /**
   * Roda o processador do worker, como o BullMQ o chamaria.
   *
   * O worker não sobe no teste; instanciar o processador com as mesmas
   * dependências da aplicação cobre o caminho real sem precisar de Redis
   * consumindo fila.
   */
  async function processar(importId: string): Promise<void> {
    const processador = new ImportacaoLeadsProcessor(
      aplicacao.prisma,
      aplicacao.storage as unknown as StorageService,
    );

    await processador.process({
      data: { officeId: conta.officeId, importId },
    } as Job<JobImportacaoLeads>);
  }

  beforeAll(async () => {
    aplicacao = await criarAplicacao();
    conta = await criarConta(aplicacao.url);

    const funis = await conta.api.get<Array<{ stages: Etapa[] }>>('/pipelines');
    etapas = funis.corpo[0]!.stages;
  });

  afterAll(async () => {
    await aplicacao.encerrar();
  });

  describe('a rota não colide com a de lead', () => {
    it('lista importações em vez de tentar ler um lead chamado "import"', async () => {
      // Este caminho já foi `/leads/import` e devolvia 400: o `@Get(':id')` do
      // LeadsController casava com "import" e o ParseUUIDPipe recusava.
      // Registrar o módulo antes não resolve — o IaModule importa o
      // LeadsModule, e é o grafo que determina a ordem real.
      const resposta = await conta.api.get<{ data: Importacao[] }>(
        '/lead-imports',
      );

      expect(resposta.status).toBe(200);
      expect(Array.isArray(resposta.corpo.data)).toBe(true);
    });

    it('/leads/import continua sendo um id inválido de lead', async () => {
      const resposta = await conta.api.get('/leads/import');

      expect(resposta.status).toBe(400);
    });
  });

  describe('prévia', () => {
    let previa: Importacao;

    it('lê o arquivo e devolve as colunas', async () => {
      const resposta = await conta.api.postArquivo<Importacao>(
        '/lead-imports',
        { nome: 'leads.csv', conteudo: PLANILHA, tipo: 'text/csv' },
      );

      expect(resposta.status).toBe(201);
      previa = resposta.corpo;

      expect(previa.status).toBe('PREVIEW');
      expect(previa.separador).toBe(';');
      expect(previa.columns?.map((c) => c.header)).toEqual([
        'Nome',
        'Telefone',
        'E-mail',
        'Observações',
        'Valor',
      ]);
    });

    it('conta as linhas de dados, sem o cabeçalho', () => {
      expect(previa.totalRows).toBe(6);
    });

    it('sugere o mapeamento a partir dos cabeçalhos', () => {
      // Abrir o formulário preenchido: errar aqui custa um clique, importar
      // sem conferir é que custa uma base suja.
      expect(previa.mapping).toEqual({
        '0': 'name',
        '1': 'remotejid',
        '2': 'email',
        '3': 'briefing',
        '4': 'value',
      });
    });

    it('nada foi gravado como lead ainda', async () => {
      const leads = await aplicacao.prisma.lead.count({
        where: { officeId: conta.officeId },
      });

      expect(leads).toBe(0);
    });

    it('o arquivo foi para o storage, sob a chave do escritório', async () => {
      const linha = await aplicacao.prisma.leadImport.findUnique({
        where: { id: previa.id },
        select: { fileKey: true },
      });

      expect(linha?.fileKey.startsWith(`${conta.officeId}/`)).toBe(true);
      expect(aplicacao.storage.arquivos.has(linha!.fileKey)).toBe(true);
    });

    it('arquivo sem linha de dados é recusado', async () => {
      const resposta = await conta.api.postArquivo('/lead-imports', {
        nome: 'vazio.csv',
        conteudo: 'nome;telefone\n',
        tipo: 'text/csv',
      });

      expect(resposta.status).toBe(400);
    });

    it('requisição sem arquivo é recusada', async () => {
      const resposta = await conta.api.post('/lead-imports', {});

      expect(resposta.status).toBe(400);
    });
  });

  describe('confirmação', () => {
    let importacao: Importacao;

    beforeAll(async () => {
      const resposta = await conta.api.postArquivo<Importacao>(
        '/lead-imports',
        { nome: 'leads.csv', conteudo: PLANILHA, tipo: 'text/csv' },
      );
      importacao = resposta.corpo;
    });

    it('recusa mapeamento sem telefone', async () => {
      // Sem telefone não há como falar com a pessoa nem como saber se ela já
      // está na base — que é a chave da deduplicação.
      const resposta = await conta.api.post(
        `/lead-imports/${importacao.id}/confirm`,
        { mapping: { '0': 'name' } },
      );

      expect(resposta.status).toBe(400);
    });

    it('recusa duas colunas para o mesmo campo', async () => {
      const resposta = await conta.api.post(
        `/lead-imports/${importacao.id}/confirm`,
        { mapping: { '0': 'name', '1': 'remotejid', '2': 'name' } },
      );

      expect(resposta.status).toBe(400);
    });

    it('recusa campo inventado', async () => {
      const resposta = await conta.api.post(
        `/lead-imports/${importacao.id}/confirm`,
        { mapping: { '1': 'remotejid', '0': 'cpf' } },
      );

      expect(resposta.status).toBe(400);
    });

    it('aceita e vai para a fila', async () => {
      const resposta = await conta.api.post<Importacao>(
        `/lead-imports/${importacao.id}/confirm`,
        {
          mapping: importacao.mapping,
          stageId: etapas[1]!.id,
        },
      );

      expect(resposta.status).toBe(201);
      expect(resposta.corpo.status).toBe('QUEUED');
    });

    it('confirmar de novo é recusado', async () => {
      const resposta = await conta.api.post(
        `/lead-imports/${importacao.id}/confirm`,
        { mapping: importacao.mapping },
      );

      expect(resposta.status).toBe(409);
    });

    describe('depois de o worker rodar', () => {
      beforeAll(async () => {
        await processar(importacao.id);
      });

      it('termina como concluída', async () => {
        const resposta = await conta.api.get<Importacao>(
          `/lead-imports/${importacao.id}`,
        );

        expect(resposta.corpo.status).toBe('DONE');
      });

      it('cria as linhas válidas e reprova as demais', async () => {
        const resposta = await conta.api.get<Importacao>(
          `/lead-imports/${importacao.id}`,
        );

        // Quatro válidas — inclusive a sem nome, que o telefone identifica.
        // Duas com erro: sem telefone e telefone curto.
        expect(resposta.corpo.importedRows).toBe(4);
        expect(resposta.corpo.failedRows).toBe(2);
      });

      it('o relatório aponta a linha de cada erro', async () => {
        const resposta = await conta.api.get<Importacao>(
          `/lead-imports/${importacao.id}`,
        );

        const erros = resposta.corpo.errors ?? [];

        // A numeração é a que a pessoa vê na planilha: a linha 1 é o cabeçalho
        expect(erros.map((e) => e.linha)).toEqual([6, 7]);
        expect(erros[0]?.motivo).toContain('branco');
        expect(erros[1]?.motivo).toContain('inválido');
      });

      it('os leads caíram na etapa escolhida', async () => {
        const leads = await aplicacao.prisma.lead.findMany({
          where: { officeId: conta.officeId },
          select: { name: true, stageId: true, source: true, status: true },
        });

        expect(leads).toHaveLength(4);
        for (const lead of leads) {
          expect(lead.stageId).toBe(etapas[1]!.id);
          expect(lead.source).toBe('IMPORT');
          // Segunda coluna aberta: o status projetado é IN_CONTACT
          expect(lead.status).toBe('IN_CONTACT');
        }
      });

      it('o telefone foi normalizado, venha como vier', async () => {
        const ana = await aplicacao.prisma.lead.findFirst({
          where: { officeId: conta.officeId, name: 'Ana Souza' },
          select: { remotejid: true, briefing: true, value: true },
        });

        // "(11) 98888-1111" e "11988882222" viram o mesmo formato
        expect(ana?.remotejid).toBe('5511988881111@c.us');
        // O campo entre aspas manteve a vírgula de dentro
        expect(ana?.briefing).toBe('Indicada por cliente, urgente');
        // "1.500,00" é como o Excel brasileiro escreve
        expect(ana?.value?.toString()).toBe('1500');
      });

      it('a linha sem nome usou o telefone como nome', async () => {
        const semNome = await aplicacao.prisma.lead.findFirst({
          where: {
            officeId: conta.officeId,
            remotejid: '5511988884444@c.us',
          },
          select: { name: true },
        });

        expect(semNome?.name).toBe('5511988884444');
      });

      it('cada lead importado entrou no histórico de etapas', async () => {
        const passagens = await aplicacao.prisma.leadStageHistory.count({
          where: { officeId: conta.officeId },
        });

        expect(passagens).toBe(4);
      });

      it('o arquivo foi removido do storage', async () => {
        // Arquivo de importação é temporário — guardado, viraria um depósito
        // de planilhas com dado pessoal.
        expect(aplicacao.storage.arquivos.size).toBeGreaterThanOrEqual(0);

        const linha = await aplicacao.prisma.leadImport.findUnique({
          where: { id: importacao.id },
          select: { fileKey: true },
        });

        expect(aplicacao.storage.arquivos.has(linha!.fileKey)).toBe(false);
      });
    });
  });

  describe('reenviar a mesma planilha não duplica ninguém', () => {
    it('todas as linhas já existentes são ignoradas, não recriadas', async () => {
      const previa = await conta.api.postArquivo<Importacao>('/lead-imports', {
        nome: 'leads.csv',
        conteudo: PLANILHA,
        tipo: 'text/csv',
      });

      await conta.api.post(`/lead-imports/${previa.corpo.id}/confirm`, {
        mapping: previa.corpo.mapping,
      });

      await processar(previa.corpo.id);

      const resposta = await conta.api.get<Importacao>(
        `/lead-imports/${previa.corpo.id}`,
      );

      expect(resposta.corpo.importedRows).toBe(0);
      expect(resposta.corpo.skippedRows).toBe(4);

      // E a base continua com quatro, não oito
      const total = await aplicacao.prisma.lead.count({
        where: { officeId: conta.officeId },
      });
      expect(total).toBe(4);
    });
  });

  describe('planilha com o mesmo número repetido dentro dela', () => {
    it('grava uma vez e ignora as repetições', async () => {
      const repetida = [
        'Nome;Telefone',
        'Primeira;11955550000',
        'Segunda;(11) 95555-0000',
        'Terceira;5511955550000',
      ].join('\n');

      const previa = await conta.api.postArquivo<Importacao>('/lead-imports', {
        nome: 'repetida.csv',
        conteudo: repetida,
        tipo: 'text/csv',
      });

      await conta.api.post(`/lead-imports/${previa.corpo.id}/confirm`, {
        mapping: { '0': 'name', '1': 'remotejid' },
      });

      await processar(previa.corpo.id);

      const resposta = await conta.api.get<Importacao>(
        `/lead-imports/${previa.corpo.id}`,
      );

      expect(resposta.corpo.importedRows).toBe(1);
      expect(resposta.corpo.skippedRows).toBe(2);
    });
  });

  describe('cancelamento', () => {
    it('descarta a importação ainda não confirmada', async () => {
      const previa = await conta.api.postArquivo<Importacao>('/lead-imports', {
        nome: 'leads.csv',
        conteudo: PLANILHA,
        tipo: 'text/csv',
      });

      const resposta = await conta.api.post<Importacao>(
        `/lead-imports/${previa.corpo.id}/cancel`,
      );

      expect(resposta.status).toBe(201);
      expect(resposta.corpo.status).toBe('CANCELED');
    });

    it('o processador não escreve nada para uma importação cancelada', async () => {
      const previa = await conta.api.postArquivo<Importacao>('/lead-imports', {
        nome: 'leads.csv',
        conteudo: PLANILHA,
        tipo: 'text/csv',
      });

      await conta.api.post(`/lead-imports/${previa.corpo.id}/cancel`);

      const antes = await aplicacao.prisma.lead.count({
        where: { officeId: conta.officeId },
      });

      // Um job repetido sobre uma importação que já saiu da fila criaria a
      // planilha inteira de novo.
      await processar(previa.corpo.id);

      const depois = await aplicacao.prisma.lead.count({
        where: { officeId: conta.officeId },
      });

      expect(depois).toBe(antes);
    });
  });
});
