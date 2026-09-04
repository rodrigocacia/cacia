import { describe, expect, it } from 'vitest';
import { booleanoDe } from './booleano-da-query';

/**
 * A armadilha que este helper existe para evitar.
 *
 * `Boolean('false')` é `true` em JavaScript — qualquer string não vazia é. O
 * `ValidationPipe` roda com `enableImplicitConversion`, então um campo
 * declarado como `boolean` recebia `true` tanto para `?status=true` quanto
 * para `?status=false`, e a listagem devolvia o contrário do pedido.
 */
describe('booleanoDe', () => {
  it('converte o texto no booleano correspondente', () => {
    expect(booleanoDe('true')).toBe(true);
    expect(booleanoDe('false')).toBe(false);
  });

  it('ausente continua ausente, e não vira filtro', () => {
    // Se virasse `false`, uma listagem sem filtro passaria a mostrar apenas os
    // registros inativos — sem ninguém ter pedido isso.
    expect(booleanoDe(undefined)).toBeUndefined();
  });

  it('é justamente o que a conversão implícita erraria', () => {
    expect(Boolean('false')).toBe(true);
    expect(booleanoDe('false')).toBe(false);
  });
});
