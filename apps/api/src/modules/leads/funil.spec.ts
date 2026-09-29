import { describe, expect, it } from 'vitest';
import { LeadStatus, StageKind } from '@cacia/database';
import { projetarStatus } from './projecao-de-status';
import { digitosDe, normalizarRemotejid, remotejidValido } from './remotejid';

/**
 * A projeção do status.
 *
 * A etapa do funil é a verdade; `status` é o resumo grosso que as telas
 * antigas e as ferramentas do agente já liam. A regra vive num lugar só — duas
 * cópias dela é como os dois começam a discordar sobre o mesmo lead.
 */
describe('projeção do status a partir da etapa', () => {
  it('primeira coluna aberta é NEW', () => {
    expect(projetarStatus({ kind: StageKind.OPEN, position: 0 })).toBe(
      LeadStatus.NEW,
    );
  });

  it('qualquer outra coluna aberta já houve contato', () => {
    expect(projetarStatus({ kind: StageKind.OPEN, position: 1 })).toBe(
      LeadStatus.IN_CONTACT,
    );
    expect(projetarStatus({ kind: StageKind.OPEN, position: 7 })).toBe(
      LeadStatus.IN_CONTACT,
    );
  });

  it('etapa de ganho é CONVERTED, mesmo sendo a primeira', () => {
    // A natureza vence a posição: um funil que começa por "Ganho" é estranho,
    // mas se existir, o lead ali dentro está convertido.
    expect(projetarStatus({ kind: StageKind.WON, position: 0 })).toBe(
      LeadStatus.CONVERTED,
    );
  });

  it('etapa de perda é LOST', () => {
    expect(projetarStatus({ kind: StageKind.LOST, position: 4 })).toBe(
      LeadStatus.LOST,
    );
  });
});

/**
 * A normalização do telefone.
 *
 * Existe por causa da unicidade `(office_id, remotejid)`: a tela gravando um
 * formato e o webhook gravando outro faria o banco ver dois contatos onde há
 * uma pessoa — exatamente o que a restrição foi criada para impedir.
 */
describe('normalização do telefone', () => {
  it('celular com DDD ganha o código do país', () => {
    expect(normalizarRemotejid('(11) 98888-7777')).toBe('5511988887777@c.us');
  });

  it('fixo de dez dígitos também', () => {
    expect(normalizarRemotejid('1133334444')).toBe('551133334444@c.us');
  });

  it('número que já tem o 55 não ganha outro', () => {
    expect(normalizarRemotejid('5511988887777')).toBe('5511988887777@c.us');
  });

  it('formatos diferentes do mesmo número dão o mesmo resultado', () => {
    // É a propriedade que a unicidade depende
    const formatos = [
      '(11) 98888-7777',
      '11 98888 7777',
      '11988887777',
      '+55 11 98888-7777',
    ];

    const normalizados = new Set(formatos.map(normalizarRemotejid));

    expect(normalizados.size).toBe(1);
  });

  it('identificador que já veio do WhatsApp passa intacto', () => {
    // Reescrever poderia quebrar identificador de grupo ou @lid
    expect(normalizarRemotejid('120363@g.us')).toBe('120363@g.us');
  });

  describe('validação', () => {
    it('aceita número com DDD', () => {
      expect(remotejidValido('11988887777')).toBe(true);
    });

    it('recusa número curto demais', () => {
      expect(remotejidValido('9999')).toBe(false);
      expect(remotejidValido('')).toBe(false);
    });

    it('validar DEPOIS de normalizar não reprovaria nada', () => {
      // O motivo de a ordem importar, preso num teste: normalizar acrescenta
      // "@c.us", e a validação aceita qualquer coisa com arroba por assumir
      // que veio do WhatsApp. Validar o já-normalizado sempre passa.
      expect(remotejidValido(normalizarRemotejid('9999'))).toBe(true);
      expect(remotejidValido('9999')).toBe(false);
    });
  });

  it('extrai só os dígitos para exibir', () => {
    expect(digitosDe('5511988887777@c.us')).toBe('5511988887777');
  });
});
