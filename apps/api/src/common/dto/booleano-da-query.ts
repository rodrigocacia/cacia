import { IsIn, IsOptional } from 'class-validator';

/**
 * Um booleano que chega pela query string.
 *
 * Fica como texto de propósito. O `ValidationPipe` roda com
 * `enableImplicitConversion`, e a conversão implícita para `boolean` usa
 * `Boolean(value)` — que devolve `true` para QUALQUER string não vazia,
 * inclusive `"false"`. Um `@Transform` não salva: quando ele roda, o valor
 * original já virou `true` e não há como recuperá-lo.
 *
 * Declarando como string, a conversão implícita não tem o que converter, e a
 * leitura fica explícita em `booleanoDe`.
 */
export const OPCOES_BOOLEANAS = ['true', 'false'] as const;

export type BooleanoDaQuery = (typeof OPCOES_BOOLEANAS)[number];

/** Decorators do campo. Use como `@BooleanoOpcional() status?: BooleanoDaQuery`. */
export function BooleanoOpcional(): PropertyDecorator {
  return function aplicar(alvo: object, chave: string | symbol): void {
    IsOptional()(alvo, chave);
    IsIn(OPCOES_BOOLEANAS, {
      message: `${String(chave)} deve ser "true" ou "false"`,
    })(alvo, chave);
  };
}

/** Converte o texto da query no booleano — `undefined` continua `undefined`. */
export function booleanoDe(valor?: BooleanoDaQuery): boolean | undefined {
  return valor === undefined ? undefined : valor === 'true';
}
