export interface Resposta<T = unknown> {
  status: number;
  corpo: T;
}

export interface OpcoesDeCliente {
  token?: string;
  officeId?: string;
  cabecalhos?: Record<string, string>;
}

/**
 * Cliente HTTP dos testes.
 *
 * Usa `fetch` contra o socket de verdade em vez de injetar a requisição no
 * handler. É o que faz o teste enxergar o que o Nest faz FORA do controller:
 * o pipe de validação, os guards globais, o código de status, os cabeçalhos
 * do helmet. Injetar direto pularia tudo isso.
 */
export class Cliente {
  constructor(
    private readonly url: string,
    private readonly opcoes: OpcoesDeCliente = {},
  ) {}

  /** Mesmo servidor, credenciais diferentes. */
  como(opcoes: OpcoesDeCliente): Cliente {
    return new Cliente(this.url, { ...this.opcoes, ...opcoes });
  }

  /** Sem escritório: para as rotas marcadas com @SkipTenant. */
  semEscritorio(): Cliente {
    const { officeId: _ignorado, ...resto } = this.opcoes;
    return new Cliente(this.url, resto);
  }

  get<T = unknown>(caminho: string): Promise<Resposta<T>> {
    return this.requisitar<T>('GET', caminho);
  }

  post<T = unknown>(caminho: string, corpo?: unknown): Promise<Resposta<T>> {
    return this.requisitar<T>('POST', caminho, corpo);
  }

  patch<T = unknown>(caminho: string, corpo?: unknown): Promise<Resposta<T>> {
    return this.requisitar<T>('PATCH', caminho, corpo);
  }

  delete<T = unknown>(caminho: string): Promise<Resposta<T>> {
    return this.requisitar<T>('DELETE', caminho);
  }

  /** Envio de arquivo — multipart, como o navegador faz. */
  async postArquivo<T = unknown>(
    caminho: string,
    arquivo: { nome: string; conteudo: string | Buffer; tipo: string },
    campos: Record<string, string> = {},
  ): Promise<Resposta<T>> {
    const formulario = new FormData();

    formulario.append(
      'file',
      new Blob([arquivo.conteudo], { type: arquivo.tipo }),
      arquivo.nome,
    );
    for (const [chave, valor] of Object.entries(campos)) {
      formulario.append(chave, valor);
    }

    // O content-type do multipart traz o boundary — deixar o fetch montá-lo
    const cabecalhos: Record<string, string> = {};
    if (this.opcoes.token) {
      cabecalhos.authorization = `Bearer ${this.opcoes.token}`;
    }
    if (this.opcoes.officeId) {
      cabecalhos['x-office-id'] = this.opcoes.officeId;
    }

    const resposta = await fetch(`${this.url}${caminho}`, {
      method: 'POST',
      headers: cabecalhos,
      body: formulario,
    });

    const texto = await resposta.text();

    return {
      status: resposta.status,
      corpo: (texto ? seguroJson(texto) : undefined) as T,
    };
  }

  async requisitar<T = unknown>(
    metodo: string,
    caminho: string,
    corpo?: unknown,
  ): Promise<Resposta<T>> {
    const cabecalhos: Record<string, string> = {
      ...(this.opcoes.cabecalhos ?? {}),
    };

    if (this.opcoes.token) {
      cabecalhos.authorization = `Bearer ${this.opcoes.token}`;
    }
    if (this.opcoes.officeId) {
      cabecalhos['x-office-id'] = this.opcoes.officeId;
    }
    if (corpo !== undefined) {
      cabecalhos['content-type'] = 'application/json';
    }

    const resposta = await fetch(`${this.url}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });

    const texto = await resposta.text();

    return {
      status: resposta.status,
      corpo: (texto ? seguroJson(texto) : undefined) as T,
    };
  }
}

/** Resposta que não é JSON não deve derrubar o teste com erro de parsing. */
function seguroJson(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
}
