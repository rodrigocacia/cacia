import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ProcessStatus, ProcessType } from './process';
import { EventStatus, EventType } from './event';
import { OfficeSignatureStatus, OfficeStatus } from './office';
import { RecurrenceStatus } from './recurrence';
import { ServiceArea } from './service';

/**
 * Os enums do painel têm de falar a mesma língua que a API.
 *
 * A API serializa o NOME do membro do enum do Prisma — "ARCHIVED", "ACTIVE".
 * Os enums daqui guardavam ora o rótulo em português ("Ativo"), ora o valor
 * gravado no banco ("active"). Nenhum dos dois chega pelo JSON, e o efeito era
 * o pior possível: nada quebrava, o componente caía no padrão e todo processo
 * aparecia como "Ativo".
 *
 * Lê o schema.prisma em vez de importar @cacia/database para não arrastar o
 * Prisma para o grafo de dependências do frontend por causa de um teste.
 *
 * Igual ao de apps/web — os dois frontends erraram do mesmo jeito.
 */

const SCHEMA = resolve(
  import.meta.dirname,
  '../../../../packages/database/prisma/schema.prisma',
);

function membrosNoPrisma(nome: string): string[] {
  const schema = readFileSync(SCHEMA, 'utf-8');
  const bloco = new RegExp(`enum ${nome} \\{([^}]*)\\}`).exec(schema);

  if (!bloco?.[1]) {
    throw new Error(`enum ${nome} não existe em schema.prisma`);
  }

  return bloco[1]
    .split('\n')
    .map((linha) => /^\s*([A-Z][A-Z0-9_]*)/.exec(linha)?.[1])
    .filter((membro): membro is string => Boolean(membro));
}

const PARES: Array<{
  nome: string;
  frontend: Record<string, string>;
  prisma: string;
  /**
   * Membro que existe no banco e o painel não oferece. Fica declarado para
   * que acrescentar um membro ao schema obrigue alguém a decidir aqui o que a
   * tela faz com ele, em vez de exibi-lo como "Outro" em produção.
   */
  lacunas: string[];
}> = [
  {
    nome: 'ProcessStatus',
    frontend: ProcessStatus,
    prisma: 'ProcessStatus',
    lacunas: [],
  },
  {
    nome: 'ProcessType',
    frontend: ProcessType,
    prisma: 'ProcessType',
    lacunas: [],
  },
  {
    nome: 'OfficeStatus',
    frontend: OfficeStatus,
    prisma: 'OfficeStatus',
    lacunas: [],
  },
  {
    nome: 'OfficeSignatureStatus',
    frontend: OfficeSignatureStatus,
    prisma: 'SignatureStatus',
    lacunas: [],
  },
  {
    nome: 'RecurrenceStatus',
    frontend: RecurrenceStatus,
    prisma: 'RecurrenceStatus',
    lacunas: [],
  },
  {
    nome: 'ServiceArea',
    frontend: ServiceArea,
    prisma: 'ServiceArea',
    lacunas: [],
  },
  // O painel só oferece parte dos tipos e status de evento nos seletores; o
  // que falta é escolha de produto, não descuido.
  {
    nome: 'EventType',
    frontend: EventType,
    prisma: 'EventType',
    // CALL e FOLLOW_UP são atividades comerciais da ficha do lead, no
    // aplicativo do escritório. O painel administrativo não as exibe.
    lacunas: ['COMMITMENT', 'SERVICE', 'CALL', 'FOLLOW_UP'],
  },
  {
    nome: 'EventStatus',
    frontend: EventStatus,
    prisma: 'EventStatus',
    lacunas: ['CANCEL', 'DONE'],
  },
];

describe('enums do painel contra o schema do banco', () => {
  for (const { nome, frontend, prisma, lacunas } of PARES) {
    describe(nome, () => {
      it('guarda o nome do membro, não um rótulo nem o valor do banco', () => {
        for (const [membro, valor] of Object.entries(frontend)) {
          expect(valor, `${nome}.${membro}`).toBe(membro);
        }
      });

      it('não inventa membro que a API nunca vai mandar', () => {
        const doPrisma = membrosNoPrisma(prisma);

        for (const membro of Object.keys(frontend)) {
          expect(doPrisma, `${nome}.${membro}`).toContain(membro);
        }
      });

      it('as lacunas são as declaradas', () => {
        const naInterface = new Set(Object.keys(frontend));
        const faltando = membrosNoPrisma(prisma).filter(
          (membro) => !naInterface.has(membro),
        );

        expect(faltando.sort()).toEqual([...lacunas].sort());
      });
    });
  }
});
