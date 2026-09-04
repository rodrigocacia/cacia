import { describe, expect, it } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@cacia/database';
import { OfficeRoleGuard } from './office-role.guard';
import { PAPEL_EXIGIDO } from '../decorators/office-role.decorator';

function contexto(officeRole?: Role): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ officeRole }) }),
    getHandler: () => 'handler',
    getClass: () => 'classe',
  } as unknown as ExecutionContext;
}

function reflectorCom(papeis?: Role[]): Reflector {
  return {
    getAllAndOverride: (chave: string) =>
      chave === PAPEL_EXIGIDO ? papeis : undefined,
  } as unknown as Reflector;
}

describe('OfficeRoleGuard', () => {
  it('libera rota sem exigência de papel', () => {
    const guard = new OfficeRoleGuard(reflectorCom(undefined));
    expect(guard.canActivate(contexto(Role.USER))).toBe(true);
  });

  it('libera quando o papel do usuário está entre os exigidos', () => {
    const guard = new OfficeRoleGuard(reflectorCom([Role.ADMIN]));
    expect(guard.canActivate(contexto(Role.ADMIN))).toBe(true);
  });

  it('recusa quando o papel não é suficiente', () => {
    const guard = new OfficeRoleGuard(reflectorCom([Role.ADMIN]));
    expect(() => guard.canActivate(contexto(Role.USER))).toThrow(
      ForbiddenException,
    );
  });

  it('recusa quando o escritório não foi resolvido', () => {
    // Acontece se a rota tiver @RequerPapel junto de @SkipTenant — combinação
    // incoerente que precisa falhar alto, não passar silenciosamente
    const guard = new OfficeRoleGuard(reflectorCom([Role.ADMIN]));
    expect(() => guard.canActivate(contexto(undefined))).toThrow(
      ForbiddenException,
    );
  });

  it('avalia o papel deste escritório, não um papel global', () => {
    // A mesma pessoa pode ser ADMIN em um escritório e USER em outro:
    // o guard só enxerga o papel que o TenantGuard resolveu para esta
    // requisição, então o papel em outro escritório é irrelevante
    const guard = new OfficeRoleGuard(reflectorCom([Role.ADMIN]));

    expect(guard.canActivate(contexto(Role.ADMIN))).toBe(true);
    expect(() => guard.canActivate(contexto(Role.USER))).toThrow(
      ForbiddenException,
    );
  });
});
