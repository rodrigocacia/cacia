"use client";

import { addCollection } from "@iconify/react";

import { colecoesDeIcones } from "@/lib/icones";

/**
 * Registra os desenhos dos ícones antes de qualquer um ser renderizado.
 *
 * Sem isto, `<Icon icon="mdi:account" />` sai para api.iconify.design buscar o
 * desenho, em tempo de execução. O efeito visível é o ícone aparecer depois do
 * resto da tela — o menu "pisca" a cada navegação. E a aplicação passa a
 * depender de um serviço de terceiros para desenhar a própria interface.
 *
 * O registro acontece no escopo do módulo, e não em `useEffect`: precisa valer
 * já na primeira renderização, inclusive a do servidor. Em `useEffect` só
 * rodaria depois — tarde demais, e o ícone já teria piscado.
 *
 * Os desenhos vêm de src/lib/icones.ts, gerado por scripts/gerar-icones.mjs.
 * Para atualizar depois de usar um ícone novo:  pnpm icones
 */
for (const colecao of colecoesDeIcones) {
  addCollection(colecao);
}

/** Não desenha nada — existe pelo efeito do módulo acima. */
export function IconesOffline() {
  return null;
}
