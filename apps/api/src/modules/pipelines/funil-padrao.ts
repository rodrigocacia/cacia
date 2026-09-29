import { StageKind } from '@cacia/database';

/**
 * O funil que todo escritório novo recebe.
 *
 * As três primeiras etapas reproduzem o que o enum `LeadStatus` já dizia —
 * `NEW`, `IN_CONTACT`, `CONVERTED` — mais a coluna de perdido, que não existia
 * e sem a qual todo lead descartado ficaria parado numa coluna aberta,
 * poluindo qualquer contagem de funil.
 *
 * Mesma lista da migration `20260909120000_crm_funil_etiquetas_importacao`,
 * que preenche as bases que já existiam. Se mudar aqui, a base antiga e a nova
 * passam a divergir — o que muda é só o ponto de partida, então divergir é
 * aceitável; o que não pode é achar que a migration acompanha sozinha.
 */
export const FUNIL_PADRAO = {
  nome: 'Funil de vendas',
  etapas: [
    { name: 'Novo', color: '#3B82F6', kind: StageKind.OPEN },
    { name: 'Em contato', color: '#8B5CF6', kind: StageKind.OPEN },
    { name: 'Proposta enviada', color: '#F59E0B', kind: StageKind.OPEN },
    { name: 'Ganho', color: '#10B981', kind: StageKind.WON },
    { name: 'Perdido', color: '#EF4444', kind: StageKind.LOST },
  ],
} as const;

/** Dados prontos para `createMany`, dado o funil e o escritório. */
export function etapasPadrao(
  officeId: string,
  pipelineId: string,
): Array<{
  officeId: string;
  pipelineId: string;
  name: string;
  color: string;
  position: number;
  kind: StageKind;
}> {
  return FUNIL_PADRAO.etapas.map((etapa, indice) => ({
    officeId,
    pipelineId,
    name: etapa.name,
    color: etapa.color,
    position: indice,
    kind: etapa.kind,
  }));
}
