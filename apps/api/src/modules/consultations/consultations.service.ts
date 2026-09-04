import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { PromptService } from '@/ai/agente/prompt.service';
import type { AtualizarConsultaDto } from './dto/consultation.dto';

const CAMPOS = {
  id: true,
  isCharged: true,
  consultationValue: true,
  requiresPaymentToSchedule: true,
  lawyerPixKey: true,
  updatedAt: true,
} as const;

/**
 * Cobrança da consulta inicial, uma linha por escritório.
 *
 * Entra no prompt do agente — por isso a alteração invalida o cache. Sem
 * invalidar, o agente seguiria informando o valor antigo por até 15 minutos,
 * e o escritório teria de honrá-lo.
 */
@Injectable()
export class ConsultationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prompt: PromptService,
  ) {}

  async obter(officeId: string) {
    const existente = await this.prisma.consultation.findUnique({
      where: { officeId },
      select: CAMPOS,
    });

    if (existente) return existente;

    return this.prisma.consultation.create({
      data: { officeId },
      select: CAMPOS,
    });
  }

  async atualizar(officeId: string, dto: AtualizarConsultaDto) {
    const atual = await this.obter(officeId);

    const cobra = dto.isCharged ?? atual.isCharged;
    const valor = dto.consultationValue ?? Number(atual.consultationValue);
    const exigePagamento =
      dto.requiresPaymentToSchedule ?? atual.requiresPaymentToSchedule;
    const pix = dto.lawyerPixKey ?? atual.lawyerPixKey;

    if (cobra && valor <= 0) {
      throw new BadRequestException(
        'Consulta cobrada precisa de um valor maior que zero',
      );
    }

    // Sem a chave, o cliente recebe a instrução de pagar e não tem para onde.
    if (exigePagamento && !pix.trim()) {
      throw new BadRequestException(
        'Exigir pagamento para agendar requer uma chave PIX cadastrada',
      );
    }

    const consulta = await this.prisma.consultation.update({
      where: { officeId },
      data: dto,
      select: CAMPOS,
    });

    await this.prompt.invalidar(officeId);

    return consulta;
  }
}
