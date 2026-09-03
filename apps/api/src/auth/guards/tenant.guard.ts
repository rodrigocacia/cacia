import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { IS_PUBLIC } from '../decorators/public.decorator';
import { SKIP_TENANT } from '../decorators/skip-tenant.decorator';
import type { RequisicaoAutenticada } from '../tipos';

/**
 * Resolve o escritório da requisição e valida que o usuário é membro dele.
 *
 * Por que um guard e não uma checagem por serviço: na arquitetura anterior cada
 * service precisava lembrar de chamar `validateUserOfficeAccess`. Era opt-in —
 * um único endpoint que esquecesse a chamada expunha dados de outro escritório,
 * e nada acusava a ausência.
 *
 * Aqui a validação é obrigatória por construção: toda rota passa pelo guard, e
 * quem não precisa de escritório declara isso explicitamente com @SkipTenant().
 * Esquecer não é mais uma possibilidade silenciosa.
 *
 * O escritório vem do cabeçalho `x-office-id` — nunca do corpo da requisição,
 * para que não se confunda com dado de negócio nem seja sobrescrito por engano.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (publica) return true;

    const semTenant = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (semTenant) return true;

    const req = context.switchToHttp().getRequest<RequisicaoAutenticada>();

    const usuario = req.user;
    if (!usuario?.userId) {
      throw new ForbiddenException('Requisição sem usuário autenticado');
    }

    const officeId = this.extrairOfficeId(req);
    if (!officeId) {
      throw new BadRequestException(
        'Cabeçalho x-office-id é obrigatório nesta rota',
      );
    }

    const vinculo = await this.prisma.officeMember.findUnique({
      where: {
        userId_officeId: { userId: usuario.userId, officeId },
      },
      select: { role: true, office: { select: { deletedAt: true } } },
    });

    // Mesma resposta para "não é membro" e "escritório não existe": informar a
    // diferença permitiria descobrir quais escritórios existem por tentativa.
    if (!vinculo || vinculo.office.deletedAt !== null) {
      throw new ForbiddenException('Usuário não tem acesso a este escritório');
    }

    req.officeId = officeId;
    req.officeRole = vinculo.role;

    return true;
  }

  private extrairOfficeId(req: RequisicaoAutenticada): string | undefined {
    const valor = req.headers['x-office-id'];
    if (typeof valor === 'string' && valor.trim() !== '') {
      return valor.trim();
    }
    return undefined;
  }
}
