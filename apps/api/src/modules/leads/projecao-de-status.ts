import { LeadStatus, StageKind } from '@cacia/database';

/**
 * Traduz a etapa do funil no `status` grosso do lead.
 *
 * A etapa é a verdade; `status` é uma PROJEÇÃO dela. Existe porque as telas
 * antigas, os filtros e as ferramentas do agente já liam esse campo — e
 * reescrever tudo isso para conhecer funil configurável seria uma refatoração
 * de interface inteira por uma informação que elas usam de forma grosseira.
 *
 * A regra vive só aqui. Duas cópias desta função é como o `status` e a etapa
 * começam a discordar, e discordando não há tela que mostre a verdade.
 */
export function projetarStatus(etapa: {
  kind: StageKind;
  position: number;
}): LeadStatus {
  if (etapa.kind === StageKind.WON) return LeadStatus.CONVERTED;
  if (etapa.kind === StageKind.LOST) return LeadStatus.LOST;

  // Primeira coluna aberta é "novo"; qualquer outra já houve contato.
  return etapa.position === 0 ? LeadStatus.NEW : LeadStatus.IN_CONTACT;
}
