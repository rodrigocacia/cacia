import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocumentVectorStatus } from '@cacia/database';
import { DocumentsService } from '@/modules/documents/documents.service';
import { RagService } from '@/ai/rag/rag.service';
import { criarAplicacao, type AplicacaoDeTeste } from './apoio/aplicacao';
import { criarDuasContas, type Conta } from './apoio/contas';

interface Documento {
  id: string;
  title: string;
  vectorStatus: string;
  vectorChunksCount: number | null;
  contentUrl: string | null;
}

const TEXTO = [
  'CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS.',
  'Cláusula primeira: o valor dos honorários é de dez mil reais.',
  'Cláusula segunda: o foro eleito é o da comarca de São Paulo.',
  'Cláusula terceira: a rescisão exige aviso prévio de trinta dias.',
].join(' ');

describe('documentos (e2e)', () => {
  let aplicacao: AplicacaoDeTeste;
  let a: Conta;
  let b: Conta;
  let documentos: DocumentsService;
  let rag: RagService;

  beforeAll(async () => {
    aplicacao = await criarAplicacao();
    [a, b] = await criarDuasContas(aplicacao.url);
    documentos = aplicacao.app.get(DocumentsService);
    rag = aplicacao.app.get(RagService);
  });

  afterAll(async () => {
    await aplicacao.encerrar();
  });

  describe('envio', () => {
    let id: string;

    it('aceita o arquivo e devolve o documento', async () => {
      const resposta = await a.api.postArquivo<Documento>(
        '/documents',
        { nome: 'contrato.txt', conteudo: TEXTO, tipo: 'text/plain' },
        { title: 'Contrato de honorários' },
      );

      expect(resposta.status).toBe(201);
      expect(resposta.corpo.title).toBe('Contrato de honorários');
      id = resposta.corpo.id;
    });

    it('nasce pendente de indexação, não indexado', async () => {
      // Extrair texto e gerar embeddings leva segundos. Fazer isso durante o
      // upload prenderia a requisição; quem indexa é o worker.
      const resposta = await a.api.get<Documento>(`/documents/${id}`);

      expect(resposta.corpo.vectorStatus).toBe(DocumentVectorStatus.PENDING);
    });

    it('guarda o conteúdo no storage, não na linha da tabela', async () => {
      // O sistema anterior gravava base64 na coluna, e toda consulta à tabela
      // carregava megabytes que ninguém tinha pedido.
      const linha = await aplicacao.prisma.document.findUnique({
        where: { id },
        select: { contentUrl: true },
      });

      expect(linha?.contentUrl).toBeTruthy();
      expect(aplicacao.storage.arquivos.has(linha!.contentUrl!)).toBe(true);
    });

    it('a chave do arquivo começa pelo escritório', async () => {
      const linha = await aplicacao.prisma.document.findUnique({
        where: { id },
        select: { contentUrl: true },
      });

      expect(linha?.contentUrl?.startsWith(`${a.officeId}/`)).toBe(true);
    });

    it('devolve link temporário para baixar', async () => {
      const resposta = await a.api.get<{ url: string }>(
        `/documents/${id}/download`,
      );

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.url).toContain('assinatura');
    });

    it('o outro escritório não baixa', async () => {
      const resposta = await b.api.get(`/documents/${id}/download`);

      expect(resposta.status).toBe(404);
    });
  });

  describe('indexação', () => {
    let id: string;

    beforeAll(async () => {
      const enviado = await a.api.postArquivo<Documento>('/documents', {
        nome: 'peticao.txt',
        conteudo: TEXTO,
        tipo: 'text/plain',
      });
      id = enviado.corpo.id;
    });

    it('gera trechos e marca como concluída', async () => {
      const trechos = await documentos.indexar(a.officeId, id);

      expect(trechos).toBeGreaterThan(0);

      const documento = await a.api.get<Documento>(`/documents/${id}`);
      expect(documento.corpo.vectorStatus).toBe(DocumentVectorStatus.COMPLETED);
      expect(documento.corpo.vectorChunksCount).toBe(trechos);
    });

    it('os vetores ficam com o escritório no payload', async () => {
      expect(aplicacao.qdrant.contarDoEscritorio(a.officeId)).toBeGreaterThan(
        0,
      );
      expect(aplicacao.qdrant.contarDoEscritorio(b.officeId)).toBe(0);
    });

    it('a busca encontra o trecho', async () => {
      // A consulta repete palavras do documento porque o embedding dos testes
      // é lexical, não semântico — ver EmbeddingsFalsa. O que se verifica
      // aqui é o caminho da busca, não a qualidade do modelo.
      const achados = await rag.buscar({
        officeId: a.officeId,
        pergunta: 'o valor dos honorários é de dez mil reais',
      });

      expect(achados.length).toBeGreaterThan(0);
      expect(achados[0]?.conteudo).toContain('honorários');
    });

    it('a busca do outro escritório não encontra nada', async () => {
      // O officeId é parte obrigatória do filtro. Este teste é o que pega uma
      // regressão em que ele deixe de ser aplicado.
      const achados = await rag.buscar({
        officeId: b.officeId,
        pergunta: 'o valor dos honorários é de dez mil reais',
      });

      expect(achados).toEqual([]);
    });

    it('documento sem texto extraível fica SKIPPED, não FAILED', async () => {
      // Imagem escaneada sem OCR não é erro — é documento do qual não há
      // texto a extrair. Tratá-lo como falha encheria a tela de alertas.
      const vazio = await a.api.postArquivo<Documento>('/documents', {
        nome: 'em-branco.txt',
        conteudo: '   \n  \n',
        tipo: 'text/plain',
      });

      const trechos = await documentos.indexar(a.officeId, vazio.corpo.id);

      expect(trechos).toBe(0);

      const documento = await a.api.get<Documento>(
        `/documents/${vazio.corpo.id}`,
      );
      expect(documento.corpo.vectorStatus).toBe(DocumentVectorStatus.SKIPPED);
    });
  });

  describe('exclusão', () => {
    it('remove os vetores junto', async () => {
      const enviado = await a.api.postArquivo<Documento>('/documents', {
        nome: 'anexo.txt',
        conteudo: TEXTO,
        tipo: 'text/plain',
      });
      const id = enviado.corpo.id;

      await documentos.indexar(a.officeId, id);
      const antes = aplicacao.qdrant.contarDoEscritorio(a.officeId);

      const exclusao = await a.api.delete(`/documents/${id}`);
      expect(exclusao.status).toBe(204);

      // Sem esta remoção, a IA continuaria citando um documento excluído
      const depois = aplicacao.qdrant.contarDoEscritorio(a.officeId);
      expect(depois).toBeLessThan(antes);
    });

    it('o arquivo permanece no storage', async () => {
      // Exclusão é reversível pelo suporte; apagar o arquivo tornaria a
      // reversão impossível.
      const enviado = await a.api.postArquivo<Documento>('/documents', {
        nome: 'reversivel.txt',
        conteudo: TEXTO,
        tipo: 'text/plain',
      });

      const linha = await aplicacao.prisma.document.findUnique({
        where: { id: enviado.corpo.id },
        select: { contentUrl: true },
      });

      await a.api.delete(`/documents/${enviado.corpo.id}`);

      expect(aplicacao.storage.arquivos.has(linha!.contentUrl!)).toBe(true);
    });
  });

  describe('falhas ficam visíveis', () => {
    it('lista os documentos cuja indexação falhou', async () => {
      const enviado = await a.api.postArquivo<Documento>('/documents', {
        nome: 'corrompido.txt',
        conteudo: TEXTO,
        tipo: 'text/plain',
      });

      // Simula o arquivo sumido do storage entre o envio e a indexação
      aplicacao.storage.arquivos.clear();

      await expect(
        documentos.indexar(a.officeId, enviado.corpo.id),
      ).rejects.toThrow();

      const falhas = await a.api.get<
        { id: string; vectorErrorMessage: string }[]
      >('/documents/indexing-failed');

      expect(falhas.status).toBe(200);
      expect(falhas.corpo.map((f) => f.id)).toContain(enviado.corpo.id);
      expect(falhas.corpo[0]?.vectorErrorMessage).toBeTruthy();
    });
  });
});
