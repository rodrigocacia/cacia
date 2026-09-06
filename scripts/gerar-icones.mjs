import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { getIcons } from '@iconify/utils';

const require = createRequire(import.meta.url);

/**
 * Gera o pacote de ícones que cada frontend embute.
 *
 * O PROBLEMA QUE ISTO RESOLVE
 *
 * `<Icon icon="mdi:account" />` com o nome em texto faz o @iconify/react
 * buscar o desenho em api.iconify.design, pela rede, em tempo de execução. O
 * efeito visível é o ícone aparecer depois do resto da tela — o menu "pisca" a
 * cada navegação até o cache do navegador esquentar.
 *
 * Não é só estética: a aplicação passa a depender de um serviço de terceiros
 * para desenhar a própria interface. Fora do ar, sem ícone. Rede lenta, menu
 * vazio.
 *
 * COMO
 *
 * Este script varre o código, junta os nomes de fato usados e extrai só esses
 * desenhos dos pacotes instalados. O resultado é um módulo que a aplicação
 * registra no início — os mesmos `<Icon icon="..." />` continuam funcionando,
 * agora sem sair para a rede.
 *
 * Extrair só o que é usado, e não os conjuntos inteiros: o `mdi` sozinho tem
 * mais de sete mil ícones. O subconjunto daqui fica na casa das dezenas de KB.
 *
 * QUANDO RODAR
 *
 *   pnpm icones
 *
 * Ao acrescentar um ícone novo na interface. O script avisa em vermelho o que
 * não encontrou — nome errado aparece aqui, e não como um espaço em branco na
 * tela.
 */

const RAIZ = resolve(import.meta.dirname, '..');

const APPS = [
  { nome: 'web', origem: 'apps/web/src', saida: 'apps/web/src/lib/icones.ts' },
  {
    nome: 'backoffice',
    origem: 'apps/backoffice/src',
    saida: 'apps/backoffice/src/lib/icones.ts',
  },
];

/**
 * As duas formas de nomear um ícone no código:
 *
 *   <Icon icon="mdi:account" />   e   icon={"mdi:account"}
 *   { rotulo: "Ativo", icon: "mdi:account" }
 *
 * A segunda — o ícone declarado como campo de um objeto de configuração — é
 * fácil de esquecer, e foi o que faltou na primeira versão deste script: 22
 * ícones de badges, tipos de documento e status de processo ficavam de fora,
 * e continuavam sendo buscados pela rede enquanto todo o resto já era local.
 */
const PADRAO = /icon\s*[=:]\s*\{?["']([a-z0-9-]+):([a-z0-9-]+)["']/g;

/**
 * Importar `Icon` direto do pacote fura tudo o que este script faz: traz de
 * volta o build com busca pela rede, e o ícone volta a piscar em uma tela só,
 * o que é bem mais difícil de perceber do que o problema original.
 */
const IMPORT_PROIBIDO = /from\s+["']@iconify\/react[^"']*["']/;
const ARQUIVO_DO_ICONE = 'icone.tsx';

function arquivosDe(diretorio) {
  const encontrados = [];

  for (const item of readdirSync(diretorio)) {
    const caminho = join(diretorio, item);

    if (statSync(caminho).isDirectory()) {
      encontrados.push(...arquivosDe(caminho));
      continue;
    }

    if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      encontrados.push(caminho);
    }
  }

  return encontrados;
}

function nomesUsados(origem) {
  const porPrefixo = new Map();

  for (const arquivo of arquivosDe(resolve(RAIZ, origem))) {
    const conteudo = readFileSync(arquivo, 'utf-8');

    for (const [, prefixo, nome] of conteudo.matchAll(PADRAO)) {
      if (!porPrefixo.has(prefixo)) porPrefixo.set(prefixo, new Set());
      porPrefixo.get(prefixo).add(nome);
    }
  }

  return porPrefixo;
}

function conjuntoInstalado(prefixo) {
  try {
    return require(`@iconify-json/${prefixo}/icons.json`);
  } catch {
    return null;
  }
}

let houveFalta = false;

for (const app of APPS) {
  for (const arquivo of arquivosDe(resolve(RAIZ, app.origem))) {
    if (arquivo.endsWith(ARQUIVO_DO_ICONE)) continue;

    if (IMPORT_PROIBIDO.test(readFileSync(arquivo, 'utf-8'))) {
      houveFalta = true;
      console.error(
        `  ✗ ${app.nome}: ${arquivo} importa de "@iconify/react" — ` +
          `use "@/components/icone", ou o ícone volta a ser buscado pela rede`,
      );
    }
  }

  const porPrefixo = nomesUsados(app.origem);
  const colecoes = [];
  let total = 0;

  for (const [prefixo, nomes] of [...porPrefixo].sort()) {
    const conjunto = conjuntoInstalado(prefixo);

    if (!conjunto) {
      houveFalta = true;
      console.error(
        `  ✗ ${app.nome}: conjunto "${prefixo}" não instalado — ` +
          `rode: pnpm add -w -D @iconify-json/${prefixo}`,
      );
      continue;
    }

    const subconjunto = getIcons(conjunto, [...nomes]);

    const ausentes = [...nomes].filter(
      (n) => !subconjunto?.icons?.[n] && !subconjunto?.aliases?.[n],
    );

    if (ausentes.length > 0) {
      houveFalta = true;
      for (const nome of ausentes) {
        console.error(
          `  ✗ ${app.nome}: "${prefixo}:${nome}" não existe no conjunto — ` +
            `confira o nome, ele nunca vai aparecer na tela`,
        );
      }
    }

    if (subconjunto) {
      colecoes.push(subconjunto);
      total += Object.keys(subconjunto.icons ?? {}).length;
    }
  }

  // O arquivo é ignorado pelo eslint de cada app (ver eslint.config.mjs):
  // regras escritas para código humano não têm o que dizer sobre 30 KB de
  // dados de desenho.
  const arquivo = `// GERADO POR scripts/gerar-icones.mjs — NÃO EDITE À MÃO.
//
// Os desenhos dos ícones usados na interface, embutidos no pacote para que o
// @iconify/react não precise buscá-los pela rede. Ver o script para o porquê.
//
// Para atualizar depois de usar um ícone novo:  pnpm icones

import type { IconifyJSON } from '@iconify/types';

export const colecoesDeIcones: IconifyJSON[] = ${JSON.stringify(colecoes, null, 2)} as unknown as IconifyJSON[];
`;

  writeFileSync(resolve(RAIZ, app.saida), arquivo, 'utf-8');

  const kb = Math.round(Buffer.byteLength(arquivo) / 1024);
  console.log(`  ✓ ${app.nome}: ${total} ícones, ${kb} KB → ${app.saida}`);
}

if (houveFalta) {
  console.error('\nHouve ícone não encontrado — ver acima.');
  process.exit(1);
}
