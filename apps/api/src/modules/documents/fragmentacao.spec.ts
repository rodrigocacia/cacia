import { describe, expect, it } from 'vitest';
import { fragmentar } from './fragmentacao';

describe('fragmentar', () => {
  it('devolve lista vazia para texto vazio', () => {
    expect(fragmentar('')).toEqual([]);
    expect(fragmentar('    ')).toEqual([]);
  });

  it('mantém texto curto em um único trecho', () => {
    const texto = 'Contrato de prestação de serviços advocatícios.';

    expect(fragmentar(texto)).toEqual([texto]);
  });

  it('normaliza espaços e quebras de linha', () => {
    const texto = 'Primeira   linha.\n\n\nSegunda    linha.';

    expect(fragmentar(texto)).toEqual(['Primeira linha. Segunda linha.']);
  });

  it('divide texto longo em vários trechos', () => {
    const texto = 'A cláusula décima estabelece o foro. '.repeat(100);

    const trechos = fragmentar(texto);

    expect(trechos.length).toBeGreaterThan(1);
    for (const trecho of trechos) {
      expect(trecho.length).toBeLessThanOrEqual(1200);
    }
  });

  it('procura fim de frase em vez de cortar no meio de uma palavra', () => {
    // Um trecho que começa no meio de uma palavra confunde a busca semântica
    const frase =
      'O contrato prevê rescisão mediante aviso prévio de trinta dias. ';
    const texto = frase.repeat(40);

    const trechos = fragmentar(texto);

    // Cada trecho, exceto possivelmente o último, deve terminar em pontuação
    for (const trecho of trechos.slice(0, -1)) {
      expect(trecho.trimEnd()).toMatch(/[.!?]$/);
    }
  });

  it('sobrepõe trechos consecutivos', () => {
    // A sobreposição existe para que informação na fronteira do corte apareça
    // inteira em pelo menos um dos trechos
    const texto = Array.from(
      { length: 200 },
      (_, i) => `Item numero ${i} do documento.`,
    ).join(' ');

    const trechos = fragmentar(texto);

    expect(trechos.length).toBeGreaterThan(1);

    const fimDoPrimeiro = trechos[0]!.slice(-100);
    const inicioDoSegundo = trechos[1]!.slice(0, 250);

    // Alguma palavra do fim do primeiro reaparece no início do segundo
    const palavras = fimDoPrimeiro.split(' ').filter((p) => p.length > 4);
    const houveSobreposicao = palavras.some((p) => inicioDoSegundo.includes(p));

    expect(houveSobreposicao).toBe(true);
  });

  it('não devolve trecho vazio', () => {
    const texto = 'Frase. '.repeat(500);

    for (const trecho of fragmentar(texto)) {
      expect(trecho.trim().length).toBeGreaterThan(0);
    }
  });
});
