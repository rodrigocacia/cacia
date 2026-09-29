import { describe, expect, it } from 'vitest';
import { decodificar, detectarSeparador, lerCsv } from './csv';
import { sugerirMapeamento } from './sugerir-mapeamento';
import { mapearLinha } from './lead-imports.service';

/**
 * O leitor de CSV.
 *
 * As duas armadilhas reais deste caso não são o formato em si — são o
 * separador e a codificação de planilha brasileira exportada do Excel. É o
 * que a maior parte destes testes cobre.
 */
describe('leitor de CSV', () => {
  describe('separador', () => {
    it('reconhece ponto e vírgula, o padrão do Excel em português', () => {
      expect(detectarSeparador('nome;telefone;email\n')).toBe(';');
    });

    it('reconhece vírgula', () => {
      expect(detectarSeparador('nome,telefone,email\n')).toBe(',');
    });

    it('não conta separador dentro de aspas', () => {
      // "Silva, João" tem uma vírgula que não separa campo nenhum. Contá-la
      // faria a vírgula vencer o ponto e vírgula, e a planilha inteira seria
      // lida como uma coluna só.
      const cabecalho = '"Silva, João";telefone;email\n';

      expect(detectarSeparador(cabecalho)).toBe(';');
    });
  });

  describe('codificação', () => {
    it('lê UTF-8', () => {
      expect(decodificar(Buffer.from('José;11999998888', 'utf-8'))).toContain(
        'José',
      );
    });

    it('lê Windows-1252, que é o que o Excel exporta', () => {
      // Sem isto "José" viraria "Jos<caractere de substituição>" e entraria
      // assim na base — não como erro, como texto válido e errado.
      const latino = Buffer.from([0x4a, 0x6f, 0x73, 0xe9]); // José em cp1252

      expect(decodificar(latino)).toBe('José');
    });

    it('remove o BOM', () => {
      // O BOM é invisível e gruda no primeiro cabeçalho: "nome" deixaria de
      // casar com "nome" na hora de sugerir o mapeamento.
      const comBom = Buffer.from('﻿nome;telefone', 'utf-8');

      expect(decodificar(comBom).startsWith('nome')).toBe(true);
    });
  });

  describe('linhas e campos', () => {
    it('separa colunas e linhas', () => {
      const linhas = lerCsv('nome;telefone\nAna;11988887777\n');

      expect(linhas).toEqual([
        ['nome', 'telefone'],
        ['Ana', '11988887777'],
      ]);
    });

    it('campo entre aspas pode conter o separador', () => {
      const linhas = lerCsv('nome;obs\nAna;"mora em SP, zona sul"\n');

      expect(linhas[1]?.[1]).toBe('mora em SP, zona sul');
    });

    it('campo entre aspas pode conter quebra de linha', () => {
      const linhas = lerCsv('nome;obs\nAna;"linha 1\nlinha 2"\n');

      expect(linhas).toHaveLength(2);
      expect(linhas[1]?.[1]).toBe('linha 1\nlinha 2');
    });

    it('aspas duplicadas viram uma aspa literal', () => {
      const linhas = lerCsv('nome\n"Ana ""Aninha"" Silva"\n');

      expect(linhas[1]?.[0]).toBe('Ana "Aninha" Silva');
    });

    it('lida com CRLF', () => {
      const linhas = lerCsv('nome;telefone\r\nAna;11988887777\r\n');

      expect(linhas[1]).toEqual(['Ana', '11988887777']);
    });

    it('ignora a linha em branco do fim do arquivo', () => {
      expect(lerCsv('nome\nAna\n\n')).toHaveLength(2);
    });

    it('o limite interrompe a leitura', () => {
      // A prévia precisa de dez linhas, não do arquivo inteiro na memória.
      const arquivo = `nome\n${Array.from({ length: 500 }, (_, i) => `Pessoa ${i}`).join('\n')}\n`;

      expect(lerCsv(arquivo, { limite: 5 })).toHaveLength(5);
    });
  });
});

describe('sugestão de mapeamento', () => {
  it('reconhece cabeçalhos comuns, com acento e pontuação', () => {
    const sugestao = sugerirMapeamento([
      'Nome',
      'E-mail',
      'Telefone',
      'Observações',
    ]);

    expect(sugestao).toEqual({
      '0': 'name',
      '1': 'email',
      '2': 'remotejid',
      '3': 'briefing',
    });
  });

  it('com "Contato" e "Telefone", o telefone é o telefone', () => {
    // A armadilha: "contato" também é apelido de nome. Numa planilha que tem
    // as duas colunas, quem tem o número é a segunda.
    const sugestao = sugerirMapeamento(['Contato', 'Telefone']);

    expect(sugestao['1']).toBe('remotejid');
    expect(sugestao['0']).toBe('name');
  });

  it('não atribui o mesmo campo a duas colunas', () => {
    const sugestao = sugerirMapeamento(['Celular', 'Telefone']);
    const campos = Object.values(sugestao);

    expect(new Set(campos).size).toBe(campos.length);
  });

  it('cabeçalho irreconhecível fica sem sugestão', () => {
    expect(sugerirMapeamento(['xpto', 'zzz'])).toEqual({});
  });
});

describe('mapeamento de uma linha', () => {
  const mapa = { '0': 'name', '1': 'remotejid', '2': 'value' } as const;

  it('normaliza o telefone para o formato do WhatsApp', () => {
    const { dados, erro } = mapearLinha(['Ana', '(11) 98888-7777', ''], {
      ...mapa,
    });

    expect(erro).toBeUndefined();
    // Sem essa normalização, a tela gravaria "(11) 98888-7777" e o webhook
    // gravaria outro formato: o banco veria dois contatos diferentes.
    expect(dados.remotejid).toBe('5511988887777@c.us');
  });

  it('lê valor no formato brasileiro', () => {
    // "1.234,56" lido como número em inglês viraria 1.23456
    const { dados } = mapearLinha(['Ana', '11988887777', 'R$ 1.234,56'], {
      ...mapa,
    });

    expect(dados.value).toBe(1234.56);
  });

  it('linha sem telefone é recusada', () => {
    const { erro } = mapearLinha(['Ana', '', ''], { ...mapa });

    expect(erro).toBe('Telefone em branco');
  });

  it('telefone curto demais é recusado', () => {
    const { erro } = mapearLinha(['Ana', '9999', ''], { ...mapa });

    expect(erro).toContain('inválido');
  });

  it('linha sem nome é aceita, com o número no lugar', () => {
    // O telefone identifica o contato; recusar a linha inteira por falta de
    // nome descartaria um lead real.
    const { dados, erro } = mapearLinha(['', '11988887777', ''], { ...mapa });

    expect(erro).toBeUndefined();
    expect(dados.name).toBe('5511988887777');
  });
});
