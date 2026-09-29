import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import type { AtualizarConfiguracaoDto } from './dto/setting.dto';

const CAMPOS = {
  id: true,
  notifyClientNewEvent: true,
  notifyClientUpdateProcess: true,
  notifyLawyerNewLead: true,
  notifyLawyerNewCustomer: true,
  notifyLawyerNewMarkLead: true,
  notifyLawyerNewMarkCustomer: true,
  notifyLawyerNewDocument: true,
  notifyLawyerNewEvent: true,
  notifyLawyerUpdateProcess: true,
  notifyLawyerUpdateSystem: true,
  aiCanMoveLeadStage: true,
  aiCanTagLead: true,
  updatedAt: true,
} as const;

/**
 * Preferências de notificação, uma linha por escritório.
 *
 * A linha nasce junto com o escritório, na mesma transação — ver
 * OfficesService.criar. Ainda assim, a leitura cria a linha se ela faltar:
 * um escritório anterior a este módulo não pode abrir a tela e receber 404.
 */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async obter(officeId: string) {
    const existente = await this.prisma.setting.findUnique({
      where: { officeId },
      select: CAMPOS,
    });

    if (existente) return existente;

    return this.prisma.setting.create({
      data: { officeId },
      select: CAMPOS,
    });
  }

  async atualizar(officeId: string, dto: AtualizarConfiguracaoDto) {
    // upsert em vez de update: garante a linha mesmo no caso acima
    return this.prisma.setting.upsert({
      where: { officeId },
      create: { officeId, ...dto },
      update: dto,
      select: CAMPOS,
    });
  }
}
