import { describe, expect, it } from 'vitest';

import {
  BOM,
  formatarReais,
  gerarCsvDeConsumo,
  hojeEmBrasilia,
  intervaloDoPeriodo,
  lerNumero,
  validarNumero,
} from './consumo-ia';

// O Intl separa "R$" do número com espaço inseparável
const semNbsp = (texto: string) => texto.replace(/\u00a0/g, ' ');

describe('formatarReais', () => {
  it('usa 2 casas e separador de milhar', () => {
    expect(semNbsp(formatarReais(1234.56))).toBe('R$ 1.234,56');
    expect(semNbsp(formatarReais(0))).toBe('R$ 0,00');
  });

  it('mostra 4 casas abaixo de um centavo, para não parecer zero', () => {
    expect(semNbsp(formatarReais(0.0038))).toBe('R$ 0,0038');
  });
});

describe('lerNumero', () => {
  it('aceita vírgula decimal e ponto de milhar', () => {
    expect(lerNumero('1.234,5')).toBe(1234.5);
    expect(lerNumero('5,5')).toBe(5.5);
  });

  it('aceita ponto decimal quando não há vírgula', () => {
    expect(lerNumero('0.28')).toBe(0.28);
  });

  it('recusa texto que não é número', () => {
    expect(lerNumero('')).toBeNull();
    expect(lerNumero('abc')).toBeNull();
    expect(lerNumero('1,2,3')).toBeNull();
  });
});

describe('período', () => {
  it('calcula hoje no fuso de Brasília', () => {
    // 01:00 UTC ainda é o dia anterior em Brasília
    expect(hojeEmBrasilia(new Date('2026-10-01T01:00:00Z'))).toBe('2026-09-30');
  });

  it('mês passado vai do dia 1 ao último dia, virando o ano', () => {
    expect(intervaloDoPeriodo('mes-passado', '2026-03-15')).toEqual({
      from: '2026-02-01',
      to: '2026-02-28',
    });
    expect(intervaloDoPeriodo('mes-passado', '2026-01-10')).toEqual({
      from: '2025-12-01',
      to: '2025-12-31',
    });
  });

  it('mês atual fica a cargo do padrão da API', () => {
    expect(intervaloDoPeriodo('mes-atual', '2026-09-29')).toEqual({});
  });

  it('personalizado ignora datas malformadas', () => {
    expect(
      intervaloDoPeriodo('personalizado', '2026-09-29', {
        de: '2026-09-01',
        ate: '29/09/2026',
      }),
    ).toEqual({ from: '2026-09-01', to: undefined });
  });
});

describe('gerarCsvDeConsumo', () => {
  const csv = gerarCsvDeConsumo([
    {
      nome: 'Silva; Souza "Advogados"',
      removido: false,
      chamadas: 1200,
      tokens: 4107700,
      custo: 6.4681,
      cobrado: 7.1149,
      semPreco: false,
    },
    {
      nome: '=HYPERLINK("x")',
      removido: true,
      chamadas: 3,
      tokens: 90,
      custo: 0.0012,
      cobrado: 0.0013,
      semPreco: true,
    },
  ]);

  const linhas = csv.slice(BOM.length).trimEnd().split('\r\n');

  it('começa com BOM para o Excel reconhecer UTF-8', () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('usa ; e vírgula decimal, escapando aspas e separador', () => {
    expect(linhas[1]).toBe(
      '"Silva; Souza ""Advogados""";Não;1200;4107700;6,4681;7,1149;Não',
    );
  });

  it('neutraliza fórmula no nome do escritório', () => {
    expect(linhas[2].startsWith(`"'=HYPERLINK(""x"")"`)).toBe(true);
    expect(linhas[2].endsWith(';Sim;3;90;0,0012;0,0013;Sim')).toBe(true);
  });

  it('fecha com a linha de total', () => {
    expect(linhas[3]).toBe('Total;;1203;4107790;6,4693;7,1162;');
  });
});

describe('validarNumero', () => {
  const margem = { min: 0, max: 1000, casas: 2 };

  it('aceita o que a API aceita', () => {
    expect(validarNumero('12,5', margem)).toBeNull();
    expect(validarNumero('1000', margem)).toBeNull();
  });

  it('recusa fora da faixa ou com casas demais', () => {
    expect(validarNumero('-1', margem)).toBe('Mínimo: 0');
    expect(validarNumero('1000,01', margem)).toBe('Máximo: 1.000');
    expect(validarNumero('1,234', margem)).toBe(
      'Use no máximo 2 casas decimais',
    );
    expect(validarNumero('x', margem)).toBe('Informe um número');
  });
});
