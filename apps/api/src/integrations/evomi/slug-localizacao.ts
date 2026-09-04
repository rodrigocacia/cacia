/**
 * O geo-targeting da Evomi identifica locais pelo nome em minúsculas, sem
 * acento, com espaços virando ponto: "São Paulo" -> "sao.paulo".
 */
export function slugLocalizacao(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.-]/g, '');
}
