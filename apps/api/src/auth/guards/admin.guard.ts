import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@cacia/database';
import { EXIGE_ADMIN } from '../decorators/admin.decorator';
import type { RequisicaoAutenticada } from '../tipos';

/**
 * Portão das rotas administrativas.
 *
 * Elas atravessam todos os escritórios — listam offices alheios, editam
 * usuários de qualquer tenant. É a única parte do sistema que escapa do
 * isolamento por escritório, e por isso o portão é explícito: a rota precisa
 * declarar `@AdminDaPlataforma()` para chegar aqui.
 *
 * Esquecer o decorator não abre a rota: ela continua sujeita ao TenantGuard,
 * que exige o cabeçalho do escritório e recusa sem ele.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const exige = this.reflector.getAllAndOverride<boolean | undefined>(
      EXIGE_ADMIN,
      [context.getHandler(), context.getClass()],
    );

    if (!exige) return true;

    const req = context.switchToHttp().getRequest<RequisicaoAutenticada>();

    if (req.user?.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Esta rota é da administração da plataforma',
      );
    }

    return true;
  }
}
