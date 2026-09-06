"use client"

import { Icon, addCollection } from "@iconify/react/offline"

import { colecoesDeIcones } from "@/lib/icones"

/**
 * O `<Icon>` da aplicação. Importe SEMPRE daqui, nunca de "@iconify/react".
 *
 * POR QUE ESTE ARQUIVO EXISTE
 *
 * `<Icon icon="mdi:account" />` com o nome em texto faz o pacote padrão do
 * Iconify buscar o desenho em api.iconify.design, pela rede, no navegador. O
 * efeito visível é o ícone aparecer depois do resto da tela.
 *
 * Não é só estética: a interface passa a depender de um serviço de terceiros
 * para se desenhar. Fora do ar, sem ícone.
 *
 * DUAS DECISÕES AQUI
 *
 * 1. O build "offline" do Iconify, que simplesmente NÃO TEM o código de busca
 *    pela rede. Não é uma configuração que alguém possa desfazer sem querer:
 *    a chamada não existe no pacote. Um ícone que falte some da tela em
 *    desenvolvimento, em vez de funcionar por acidente na máquina de quem tem
 *    o cache quente e falhar no cliente.
 *
 * 2. O registro no escopo do módulo, e não num `useEffect` de um componente
 *    solto no layout. Quem importa `Icon` daqui importa o registro junto — a
 *    ordem passa a ser garantida pelo grafo de imports, não pela ordem em que
 *    o React resolve a árvore. Era esse o buraco da tentativa anterior.
 *
 * Os desenhos vêm de lib/icones.ts, gerado por `pnpm icones`.
 *
 * O "use client" no topo não é decoração: o build do Iconify é um módulo de
 * cliente, e `addCollection` chamado durante a renderização no servidor falha
 * com "Attempted to call addCollection() from the server". Com a diretiva, o
 * módulo é avaliado no cliente e também durante a renderização no servidor
 * dos componentes de cliente — que é justamente onde o registro precisa
 * acontecer para o ícone já vir pronto no HTML, sem piscar.
 */
for (const colecao of colecoesDeIcones) {
  addCollection(colecao)
}

export { Icon }
