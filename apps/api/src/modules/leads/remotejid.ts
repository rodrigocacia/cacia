/**
 * Normaliza um telefone para o identificador que o WhatsApp usa.
 *
 * Existe por causa da unicidade `(office_id, remotejid)`: se a tela gravasse
 * `(11) 98888-7777` e o webhook gravasse `5511988887777@c.us`, o banco veria
 * dois contatos diferentes e a mesma pessoa teria duas fichas — que é
 * exatamente o que a restrição foi criada para impedir.
 *
 * O que já vem com `@` passa intacto: veio do WhatsApp, e reescrever poderia
 * quebrar identificadores de grupo ou `@lid`.
 */
export function normalizarRemotejid(valor: string): string {
  const bruto = valor.trim();

  if (bruto.includes('@')) return bruto;

  const digitos = bruto.replace(/\D/g, '');

  // Número brasileiro digitado sem o código do país — o caso comum na tela e
  // na planilha. Dez dígitos é fixo antigo, onze é celular com o 9.
  const comPais =
    digitos.length === 10 || digitos.length === 11 ? `55${digitos}` : digitos;

  return `${comPais}@c.us`;
}

/** Um telefone plausível tem ao menos DDD e número. */
export function remotejidValido(valor: string): boolean {
  if (valor.includes('@')) return valor.length > 1;

  return valor.replace(/\D/g, '').length >= 10;
}

/** Só os dígitos, para exibir ou comparar. */
export function digitosDe(remotejid: string): string {
  return (remotejid.split('@')[0] ?? '').replace(/\D/g, '');
}
