import type {
  FiltroBusca,
  PayloadVetor,
  ResultadoBusca,
} from '@/integrations/qdrant/qdrant.service';
import type { ArquivoEnviado } from '@/infra/storage/storage.service';

/**
 * Substitutos das integrações externas.
 *
 * Não são no-ops. O Qdrant e o storage guardam de verdade o que recebem e
 * respeitam os filtros — sem isso, um teste de "indexar documento e depois
 * excluir" passaria mesmo que o código nunca tivesse escrito nem apagado
 * nada, que é justamente a falha que ele deveria pegar.
 *
 * O que é no-op de propósito: OpenAI e WhatsApp. Ali o valor de retorno não
 * é verificável em teste de integração — a resposta de um modelo não é
 * determinística, e o envio de mensagem é efeito externo.
 */

// ---------------------------------------------------------------------------
// Qdrant em memória
// ---------------------------------------------------------------------------

interface PontoGuardado {
  id: string;
  vetor: number[];
  payload: PayloadVetor;
}

export class QdrantEmMemoria {
  readonly pontos = new Map<string, PontoGuardado>();

  onModuleInit(): Promise<void> {
    return Promise.resolve();
  }

  inserir(pontos: PontoGuardado[]): Promise<void> {
    for (const ponto of pontos) this.pontos.set(ponto.id, ponto);
    return Promise.resolve();
  }

  /**
   * Similaridade de cosseno sobre o que está guardado.
   *
   * Os embeddings do dublê são determinísticos (ver `EmbeddingsFalsa`), então
   * texto igual dá vetor igual e a ordenação é verificável.
   */
  buscar(
    vetor: number[],
    filtro: FiltroBusca,
    limite = 5,
  ): Promise<ResultadoBusca[]> {
    const candidatos = [...this.pontos.values()].filter((p) =>
      this.combina(p.payload, filtro),
    );

    const pontuados = candidatos
      .map((p) => ({
        id: p.id,
        score: cosseno(vetor, p.vetor),
        payload: p.payload,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limite);

    return Promise.resolve(pontuados);
  }

  removerPorDocumento(officeId: string, documentId: string): Promise<void> {
    for (const [id, ponto] of this.pontos) {
      if (
        ponto.payload.officeId === officeId &&
        ponto.payload.documentId === documentId
      ) {
        this.pontos.delete(id);
      }
    }
    return Promise.resolve();
  }

  remover(ids: string[]): Promise<void> {
    for (const id of ids) this.pontos.delete(id);
    return Promise.resolve();
  }

  estaSaudavel(): Promise<boolean> {
    return Promise.resolve(true);
  }

  /** Só para os testes: quantos pontos existem de um escritório. */
  contarDoEscritorio(officeId: string): number {
    return [...this.pontos.values()].filter(
      (p) => p.payload.officeId === officeId,
    ).length;
  }

  private combina(payload: PayloadVetor, filtro: FiltroBusca): boolean {
    return Object.entries(filtro).every(([campo, valor]) => {
      if (valor === undefined) return true;
      return payload[campo as keyof PayloadVetor] === valor;
    });
  }
}

function cosseno(a: number[], b: number[]): number {
  let produto = 0;
  let normaA = 0;
  let normaB = 0;

  for (let i = 0; i < a.length; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    produto += x * y;
    normaA += x * x;
    normaB += y * y;
  }

  const denominador = Math.sqrt(normaA) * Math.sqrt(normaB);
  return denominador === 0 ? 0 : produto / denominador;
}

// ---------------------------------------------------------------------------
// Embeddings determinísticos
// ---------------------------------------------------------------------------

// Largo o bastante para que palavras diferentes raramente caiam na mesma
// posição: colisão inflaria a semelhança entre textos sem nada em comum.
const DIMENSOES = 128;

/**
 * Vetor derivado do próprio texto — saco de palavras com posição por hash.
 *
 * Textos iguais dão vetores iguais e textos que compartilham palavras ficam
 * próximos. Não é semântico: "honorários" e "remuneração" ficam distantes.
 * Serve para testar o CAMINHO da busca (filtro por escritório, ordenação,
 * limite), não a qualidade do modelo — por isso os testes consultam com
 * trechos do próprio documento.
 */
export class EmbeddingsFalsa {
  gerar(texto: string): Promise<number[]> {
    const vetor = new Array<number>(DIMENSOES).fill(0);

    for (const palavra of texto.toLowerCase().split(/\W+/).filter(Boolean)) {
      let hash = 0;
      for (const caractere of palavra) {
        hash = (hash * 31 + caractere.charCodeAt(0)) | 0;
      }
      const posicao = Math.abs(hash) % DIMENSOES;
      vetor[posicao] = (vetor[posicao] ?? 0) + 1;
    }

    return Promise.resolve(vetor);
  }

  async gerarEmLote(textos: string[]): Promise<number[][]> {
    return Promise.all(textos.map((t) => this.gerar(t)));
  }
}

// ---------------------------------------------------------------------------
// Storage em memória
// ---------------------------------------------------------------------------

export class StorageEmMemoria {
  readonly arquivos = new Map<string, Buffer>();
  private contador = 0;

  enviar(params: {
    officeId: string;
    conteudo: Buffer;
    nomeOriginal: string;
    mimetype: string;
    publico?: boolean;
  }): Promise<ArquivoEnviado> {
    const extensao = params.nomeOriginal.split('.').pop() ?? 'bin';
    const chave = `${params.officeId}/${++this.contador}.${extensao}`;

    this.arquivos.set(chave, params.conteudo);

    return Promise.resolve({
      chave,
      url: chave,
      tamanhoBytes: params.conteudo.byteLength,
    });
  }

  gerarLinkTemporario(chave: string): Promise<string> {
    return Promise.resolve(`https://storage.teste/${chave}?assinatura=x`);
  }

  baixar(chave: string): Promise<Buffer> {
    const conteudo = this.arquivos.get(chave);
    if (!conteudo) return Promise.reject(new Error(`Sem arquivo: ${chave}`));
    return Promise.resolve(conteudo);
  }

  remover(chave: string): Promise<void> {
    this.arquivos.delete(chave);
    return Promise.resolve();
  }

  /** Idêntica à implementação real — é a regra que se quer testar. */
  pertenceAoEscritorio(chave: string, officeId: string): boolean {
    return chave.startsWith(`${officeId}/`);
  }
}

// ---------------------------------------------------------------------------
// Integrações que só produzem efeito externo
// ---------------------------------------------------------------------------

/** Registra o que foi chamado, para que o teste possa afirmar sobre isso. */
export class RegistroDeChamadas {
  readonly chamadas: { metodo: string; argumentos: unknown[] }[] = [];

  registrar(metodo: string, argumentos: unknown[]): void {
    this.chamadas.push({ metodo, argumentos });
  }

  vezes(metodo: string): number {
    return this.chamadas.filter((c) => c.metodo === metodo).length;
  }

  limpar(): void {
    this.chamadas.length = 0;
  }
}

export class WahaFalso extends RegistroDeChamadas {
  configPadrao() {
    return { url: 'http://waha.teste', apiKey: 'x' };
  }

  criarSessao(...argumentos: unknown[]): Promise<unknown> {
    this.registrar('criarSessao', argumentos);
    return Promise.resolve({ name: 'sessao', status: 'STARTING' });
  }

  obterSessao(...argumentos: unknown[]): Promise<unknown> {
    this.registrar('obterSessao', argumentos);
    return Promise.resolve({ name: 'sessao', status: 'WORKING' });
  }

  iniciarSessao(...argumentos: unknown[]): Promise<unknown> {
    this.registrar('iniciarSessao', argumentos);
    return Promise.resolve({ name: 'sessao', status: 'STARTING' });
  }

  pararSessao(...argumentos: unknown[]): Promise<unknown> {
    this.registrar('pararSessao', argumentos);
    return Promise.resolve({ name: 'sessao', status: 'STOPPED' });
  }

  encerrarSessao(...argumentos: unknown[]): Promise<unknown> {
    this.registrar('encerrarSessao', argumentos);
    return Promise.resolve({ name: 'sessao', status: 'STOPPED' });
  }

  removerSessao(...argumentos: unknown[]): Promise<void> {
    this.registrar('removerSessao', argumentos);
    return Promise.resolve();
  }

  obterQrCode(...argumentos: unknown[]): Promise<{ value?: string }> {
    this.registrar('obterQrCode', argumentos);
    return Promise.resolve({ value: 'qr-falso' });
  }

  trocarProxy(...argumentos: unknown[]): Promise<void> {
    this.registrar('trocarProxy', argumentos);
    return Promise.resolve();
  }

  resolverLid(...argumentos: unknown[]): Promise<string | null> {
    this.registrar('resolverLid', argumentos);
    return Promise.resolve(null);
  }

  enviarTexto(...argumentos: unknown[]): Promise<unknown> {
    this.registrar('enviarTexto', argumentos);
    return Promise.resolve({ id: 'mensagem-falsa' });
  }

  enviarArquivo(...argumentos: unknown[]): Promise<unknown> {
    this.registrar('enviarArquivo', argumentos);
    return Promise.resolve({ id: 'mensagem-falsa' });
  }

  enviarAudio(...argumentos: unknown[]): Promise<unknown> {
    this.registrar('enviarAudio', argumentos);
    return Promise.resolve({ id: 'mensagem-falsa' });
  }

  sinalizarDigitando(...argumentos: unknown[]): Promise<void> {
    this.registrar('sinalizarDigitando', argumentos);
    return Promise.resolve();
  }
}

export class EvolutionFalso extends RegistroDeChamadas {
  criarInstancia(...argumentos: unknown[]): Promise<unknown> {
    this.registrar('criarInstancia', argumentos);
    return Promise.resolve({ instance: { instanceName: 'falsa' } });
  }

  enviarTexto(...argumentos: unknown[]): Promise<unknown> {
    this.registrar('enviarTexto', argumentos);
    return Promise.resolve({ key: { id: 'falsa' } });
  }

  enviarMidia(...argumentos: unknown[]): Promise<unknown> {
    this.registrar('enviarMidia', argumentos);
    return Promise.resolve({ key: { id: 'falsa' } });
  }

  enviarAudio(...argumentos: unknown[]): Promise<unknown> {
    this.registrar('enviarAudio', argumentos);
    return Promise.resolve({ key: { id: 'falsa' } });
  }
}

/**
 * Proxy configurado, para que o teste de conexão exercite o caminho em que
 * ele existe — que é onde estava o defeito do sistema anterior.
 */
export class EvomiFalso extends RegistroDeChamadas {
  estaConfigurado(): boolean {
    return true;
  }

  obterCredenciais(): Promise<unknown> {
    this.registrar('obterCredenciais', []);
    return Promise.resolve({
      usuario: 'usuario-teste',
      senha: 'senha-teste',
      host: 'proxy.teste',
      porta: 1000,
    });
  }

  resolverParaLocalizacao(...argumentos: unknown[]): Promise<unknown> {
    this.registrar('resolverParaLocalizacao', argumentos);
    return Promise.resolve({
      servidor: 'http://proxy.teste:1000',
      usuario: 'usuario-teste',
      senha: 'senha-teste',
    });
  }
}

export class JuditFalso extends RegistroDeChamadas {
  estaConfigurado(): boolean {
    return true;
  }

  consultar(...argumentos: unknown[]): Promise<unknown> {
    this.registrar('consultar', argumentos);
    return Promise.resolve({ request_id: 'requisicao-falsa' });
  }

  monitorar(...argumentos: unknown[]): Promise<unknown> {
    this.registrar('monitorar', argumentos);
    return Promise.resolve({ tracking_id: 'monitoramento-falso' });
  }

  pararMonitoramento(...argumentos: unknown[]): Promise<void> {
    this.registrar('pararMonitoramento', argumentos);
    return Promise.resolve();
  }

  buscarPorOab(...argumentos: unknown[]): Promise<unknown> {
    this.registrar('buscarPorOab', argumentos);
    return Promise.resolve({ request_id: 'requisicao-falsa' });
  }
}

export class AgenteFalso extends RegistroDeChamadas {
  responder(...argumentos: unknown[]): Promise<unknown> {
    this.registrar('responder', argumentos);
    return Promise.resolve({
      texto: 'Resposta de teste.',
      ferramentasUsadas: [],
    });
  }
}
