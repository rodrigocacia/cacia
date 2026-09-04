import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationStatus } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { janela, montarPaginacao } from '@/common/dto/paginacao.dto';

const CAMPOS = {
  id: true,
  type: true,
  status: true,
  typeId: true,
  typeTitle: true,
  typeDetail: true,
  createdAt: true,
} as const;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(
    officeId: string,
    userId: string,
    dto: { page: number; limit: number },
  ) {
    // Filtra por escritório E por usuário: a notificação é de uma pessoa
    // dentro de um escritório, não do escritório inteiro.
    const where = { officeId, userId, deletedAt: null };

    const [data, total, naoLidas] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        select: CAMPOS,
        orderBy: { createdAt: 'desc' },
        ...janela(dto),
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { ...where, status: NotificationStatus.DELIVERY },
      }),
    ]);

    return { ...montarPaginacao(data, total, dto), unread: naoLidas };
  }

  async marcarComoLida(
    officeId: string,
    userId: string,
    id: string,
  ): Promise<void> {
    const { count } = await this.prisma.notification.updateMany({
      where: { id, officeId, userId },
      data: { status: NotificationStatus.OPEN },
    });

    if (count === 0) throw new NotFoundException('Notificação não encontrada');
  }

  async marcarTodasComoLidas(
    officeId: string,
    userId: string,
  ): Promise<{ updated: number }> {
    const { count } = await this.prisma.notification.updateMany({
      where: { officeId, userId, status: NotificationStatus.DELIVERY },
      data: { status: NotificationStatus.OPEN },
    });

    return { updated: count };
  }
}
