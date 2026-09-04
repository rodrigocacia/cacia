import { randomUUID } from 'node:crypto';
import { Cliente } from './cliente';

export interface Conta {
  userId: string;
  officeId: string;
  token: string;
  email: string;
  /** Já autenticado e com o escritório no cabeçalho. */
  api: Cliente;
}

let sequencia = 0;

/**
 * Cria um usuário com escritório próprio, pelas rotas públicas da API.
 *
 * De propósito não escreve no banco direto: assim o preparo de cada teste é,
 * ele mesmo, uma verificação de que cadastro e criação de escritório
 * funcionam. Se qualquer um dos dois quebrar, a suíte inteira acusa.
 */
export async function criarConta(
  url: string,
  nome = 'Escritório de Teste',
): Promise<Conta> {
  const publico = new Cliente(url);
  const indice = ++sequencia;
  const email = `teste-${indice}-${randomUUID().slice(0, 8)}@cacia.test`;

  const cadastro = await publico.post<{
    token: string;
    user: { id: string };
  }>('/auth/register', {
    name: `Usuário ${indice}`,
    email,
    password: 'senha-de-teste-123',
  });

  if (cadastro.status !== 201) {
    throw new Error(
      `Cadastro falhou (${cadastro.status}): ${JSON.stringify(cadastro.corpo)}`,
    );
  }

  const token = cadastro.corpo.token;
  const autenticado = publico.como({ token });

  const escritorio = await autenticado.post<{ id: string }>('/offices', {
    name: nome,
    document: String(10000000000000 + indice),
    oabNumber: String(100000 + indice),
    oabUf: 'SP',
  });

  if (escritorio.status !== 201) {
    throw new Error(
      `Criação de escritório falhou (${escritorio.status}): ` +
        JSON.stringify(escritorio.corpo),
    );
  }

  return {
    userId: cadastro.corpo.user.id,
    officeId: escritorio.corpo.id,
    token,
    email,
    api: autenticado.como({ officeId: escritorio.corpo.id }),
  };
}

/** Duas contas independentes — a base de todo teste de isolamento. */
export async function criarDuasContas(url: string): Promise<[Conta, Conta]> {
  return [
    await criarConta(url, 'Escritório A'),
    await criarConta(url, 'Escritório B'),
  ];
}
