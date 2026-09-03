import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequisicaoAutenticada } from '../tipos';

/**
 * Escritório da requisição, já validado pelo TenantGuard.
 *
 * Esta é a ÚNICA forma de um controller obter o officeId. Não leia do corpo,
 * da query nem do parâmetro de rota: esses valores vêm do cliente e não passam
 * por validação de vínculo.
 */
export const CurrentOffice = createParamDecorator(
  (_dado: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<RequisicaoAutenticada>();
    if (!req.officeId) {
      throw new Error(
        'CurrentOffice usado em rota com @SkipTenant() ou sem TenantGuard',
      );
    }
    return req.officeId;
  },
);
