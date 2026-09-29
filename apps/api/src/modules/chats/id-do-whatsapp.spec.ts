import { describe, expect, it } from 'vitest';
import { idCurto, idDaResposta } from './id-do-whatsapp';

describe('id do WhatsApp', () => {
  it('reduz o id serializado ao último segmento', () => {
    expect(idCurto('true_5511988887777@c.us_3EB0ABC')).toBe('3EB0ABC');
    expect(idCurto('3EB0ABC')).toBe('3EB0ABC');
    expect(idCurto(undefined)).toBeNull();
  });

  it('entende as respostas dos dois provedores', () => {
    // O evento de entrega e a resposta do envio precisam dar o mesmo id
    expect(idDaResposta({ id: 'true_5511@c.us_AAA' })).toBe('AAA');
    expect(idDaResposta({ id: { _serialized: 'true_5511@c.us_BBB' } })).toBe(
      'BBB',
    );
    expect(idDaResposta({ key: { id: 'CCC' } })).toBe('CCC');
    expect(idDaResposta(undefined)).toBeNull();
    expect(idDaResposta({})).toBeNull();
  });
});
