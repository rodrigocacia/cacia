import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@cacia/database';
import { PAPEL_EXIGIDO } from '../decorators/office-role.decorator';
import type { RequisicaoAutenticada } from '../tipos';

/**
 * Confere o papel do usuário DENTRO do escritório da requisição.
 *
 * Roda depois do TenantGuard, que já preencheu req.officeRole a partir do
 * vínculo em office_members.
 */
@Injectable()
export class OfficeRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const exigidos = this.reflector.getAllAndOverride<Role[] | undefined>(
      PAPEL_EXIGIDO,
      [context.getHandler(), context.getClass()],
    );

    if (!exigidos?.length) return true;

    const req = context.switchToHttp().getRequest<RequisicaoAutenticada>();

    if (!req.officeRole) {
      throw new ForbiddenException(
        'Rota exige papel de escritório, mas o escritório não foi resolvido',
      );
    }

    if (!exigidos.includes(req.officeRole)) {
      throw new ForbiddenException(
        'Seu papel neste escritório não permite esta operação',
      );
    }

    return true;
  }
}
