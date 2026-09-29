/**
 * O id de uma mensagem do WhatsApp na forma curta.
 *
 * Cada motor devolve o id de um jeito: `true_5511...@c.us_3EB0ABC` (string
 * serializada), `{ _serialized: ... }`, ou `{ key: { id: '3EB0ABC' } }` na
 * Evolution. O evento de entrega pode vir num formato e a resposta do envio em
 * outro. O último segmento, o `3EB0ABC`, é o que todos têm em comum, então é
 * ele que fica gravado e é por ele que se compara.
 */
export function idCurto(valor: string | null | undefined): string | null {
  if (!valor) return null;
  return valor.split('_').pop() || null;
}

/** Extrai o id da resposta de envio, qualquer que seja o formato. */
export function idDaResposta(resposta: unknown): string | null {
  if (!resposta || typeof resposta !== 'object') return null;

  const r = resposta as {
    id?: string | { _serialized?: string; id?: string };
    key?: { id?: string };
  };

  if (typeof r.id === 'string') return idCurto(r.id);
  if (r.id?._serialized) return idCurto(r.id._serialized);
  if (r.id?.id) return r.id.id;
  if (r.key?.id) return r.key.id;

  return null;
}
