import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequisicaoAutenticada, UsuarioAutenticado } from '../tipos';

export const CurrentUser = createParamDecorator(
  (_dado: unknown, ctx: ExecutionContext): UsuarioAutenticado => {
    const req = ctx.switchToHttp().getRequest<RequisicaoAutenticada>();
    if (!req.user) {
      throw new Error('CurrentUser usado em rota sem autenticação');
    }
    return req.user;
  },
);
