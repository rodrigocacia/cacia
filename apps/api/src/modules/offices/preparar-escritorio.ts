import { AgentStyle, AgentType, type Prisma } from '@cacia/database';
import { etapasPadrao, FUNIL_PADRAO } from '../pipelines/funil-padrao';

/**
 * Os agentes que todo escritório novo recebe — os mesmos do sistema anterior.
 *
 * Sem o de atendimento (`SUPPORT`), a primeira mensagem que chega pelo
 * WhatsApp não abre conversa: `ChatsService` recusa com "nenhum agente de
 * atendimento configurado", e a pessoa fica sem resposta. As telas de
 * configuração da IA também só editam agente existente — não criam.
 *
 * Mesma lista da migration `20260928120000_agentes_padrao`, que completa os
 * escritórios criados antes desta função existir.
 */
export const AGENTES_PADRAO = [
  { type: AgentType.SUPPORT, style: AgentStyle.LEGAL_FORMAL },
  { type: AgentType.PERSONAL, style: AgentStyle.LEGAL_FORMAL },
] as const;

const SAUDACAO_PADRAO = 'Olá, como posso ajudar?';

/**
 * Tudo o que um escritório precisa para funcionar, criado junto com ele.
 *
 * Existe um lugar só porque são dois caminhos de criação — o autocadastro
 * (`OfficesService.criar`) e o painel administrativo (`AdminService`) — e
 * cada um mantendo a própria lista já fez o do painel nascer sem funil e os
 * dois nascerem sem agente.
 */
export async function prepararEscritorio(
  tx: Prisma.TransactionClient,
  officeId: string,
): Promise<void> {
  // Um registro por escritório — sem eles, todo leitor teria de tratar o
  // caso nulo.
  await tx.setting.create({ data: { officeId } });
  await tx.consultation.create({ data: { officeId } });

  // Sem funil, o primeiro lead a chegar pelo WhatsApp não teria etapa nenhuma
  // e ficaria fora do quadro.
  const funil = await tx.pipeline.create({
    data: { officeId, name: FUNIL_PADRAO.nome, isDefault: true },
    select: { id: true },
  });

  await tx.pipelineStage.createMany({
    data: etapasPadrao(officeId, funil.id),
  });

  await tx.agent.createMany({
    data: AGENTES_PADRAO.map((agente) => ({
      officeId,
      ...agente,
      greeting: SAUDACAO_PADRAO,
    })),
  });
}
