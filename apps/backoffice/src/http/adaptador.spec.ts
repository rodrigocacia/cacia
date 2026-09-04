import { describe, expect, it } from 'vitest';
import {
  limparCorpo,
  limparQuery,
  paginaLegada,
  paraApi,
  paraLegado,
} from './adaptador';

/**
 * A tradução entre o vocabulário da interface e o da API.
 *
 * É o ponto onde um erro não quebra uma tela, e sim todas: um campo renomeado
 * errado aparece como "undefined" na aplicação inteira ao mesmo tempo.
 */
describe('paraLegado', () => {
  it('converte as chaves para snake_case', () => {
    expect(paraLegado({ legalName: 'Silva LTDA', tradeName: 'Silva' })).toEqual(
      { legal_name: 'Silva LTDA', trade_name: 'Silva' },
    );
  });

  it('mantém `id` e acrescenta `_id`', () => {
    // A interface inteira identifica registro por `_id`; devolver os dois
    // evita ter de caçar cada leitura agora.
    expect(paraLegado({ id: 'abc', name: 'Joana' })).toEqual({
      id: 'abc',
      _id: 'abc',
      name: 'Joana',
    });
  });

  it('desce por objetos aninhados e listas', () => {
    const entrada = {
      lastProcesses: [
        { id: 'p1', customer: { id: 'c1', legalName: 'Silva LTDA' } },
      ],
    };

    expect(paraLegado(entrada)).toEqual({
      last_processes: [
        {
          id: 'p1',
          _id: 'p1',
          customer: { id: 'c1', _id: 'c1', legal_name: 'Silva LTDA' },
        },
      ],
    });
  });

  it('NÃO mexe no interior dos campos opacos', () => {
    // `template_variables` guarda as variáveis do documento, com chaves em
    // camelCase por desenho; `subjects` vem cru da Judit. Renomear as chaves
    // internas corromperia os dois.
    const entrada = {
      templateVariables: { clientName: 'Joana', lawyerOab: '123456' },
      subjects: [{ code: '10459', name: 'USUCAPIÃO' }],
    };

    const saida = paraLegado<{
      template_variables: Record<string, string>;
      subjects: { code: string }[];
    }>(entrada);

    expect(saida.template_variables).toEqual({
      clientName: 'Joana',
      lawyerOab: '123456',
    });
    expect(saida.subjects[0]?.code).toBe('10459');
  });

  it('não estraga valores que não são objeto', () => {
    expect(paraLegado({ total: 3, ativo: true, quando: null })).toEqual({
      total: 3,
      ativo: true,
      quando: null,
    });
  });

  it('preserva as datas em vez de virá-las do avesso', () => {
    const quando = new Date('2027-03-10T14:00:00.000Z');

    const saida = paraLegado<{ created_at: Date }>({ createdAt: quando });

    expect(saida.created_at).toBe(quando);
  });
});

describe('paraApi', () => {
  it('converte as chaves para camelCase', () => {
    expect(paraApi({ legal_name: 'Silva LTDA', trade_name: 'Silva' })).toEqual({
      legalName: 'Silva LTDA',
      tradeName: 'Silva',
    });
  });

  it('não acrescenta `_id` no caminho de ida', () => {
    expect(paraApi({ id: 'abc' })).toEqual({ id: 'abc' });
  });

  it('lida com número no meio do nome', () => {
    expect(paraApi({ shift2_start_time: '14:00' })).toEqual({
      shift2StartTime: '14:00',
    });
  });
});

describe('limparCorpo', () => {
  it('tira o escritório do corpo', () => {
    // A API valida com `forbidNonWhitelisted`: campo fora do DTO devolve 400,
    // não é ignorado. O escritório vai no cabeçalho `x-office-id`.
    expect(
      limparCorpo({ office_id: 'esc-1', office: 'esc-1', name: 'Joana' }),
    ).toEqual({ name: 'Joana' });
  });

  it('tira os campos indefinidos', () => {
    expect(limparCorpo({ name: 'Joana', email: undefined })).toEqual({
      name: 'Joana',
    });
  });

  it('mantém `null`, que significa desvincular', () => {
    expect(limparCorpo({ customer_id: null })).toEqual({ customerId: null });
  });

  it('converte as chaves que sobram', () => {
    expect(limparCorpo({ office_id: 'x', legal_name: 'Silva' })).toEqual({
      legalName: 'Silva',
    });
  });
});

describe('limparQuery', () => {
  it('tira o escritório da query', () => {
    const params = new URLSearchParams({ office_id: 'esc-1', page: '2' });

    expect(limparQuery(params).toString()).toBe('page=2');
  });
});

describe('paginaLegada', () => {
  it('converte o formato de página da API no da interface', () => {
    const resposta = {
      data: [{ id: 'c1', legalName: 'Silva LTDA' }],
      meta: { page: 2, limit: 20, total: 41, totalPages: 3 },
    };

    expect(paginaLegada(resposta)).toEqual({
      data: [{ id: 'c1', _id: 'c1', legal_name: 'Silva LTDA' }],
      totalItems: 41,
      totalPages: 3,
      currentPage: 2,
      perPage: 20,
    });
  });

  it('resposta inesperada devolve página vazia, não derruba a tela', () => {
    // Sem isto, um erro de formato viraria "cannot read property of
    // undefined" no meio da renderização — e a tela inteira ficaria em branco.
    expect(paginaLegada(undefined).data).toEqual([]);
    expect(paginaLegada({ mensagem: 'erro' }).data).toEqual([]);
  });

  it('lista sem meta é tratada como página única', () => {
    const resposta = { data: [{ id: 'a' }, { id: 'b' }] };

    expect(paginaLegada(resposta)).toMatchObject({
      totalItems: 2,
      totalPages: 1,
      currentPage: 1,
    });
  });
});
