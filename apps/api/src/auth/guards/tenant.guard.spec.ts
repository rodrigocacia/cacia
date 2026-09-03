import { describe, expect, it, vi } from 'vitest';
import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './tenant.guard';
import { IS_PUBLIC } from '../decorators/public.decorator';
import { SKIP_TENANT } from '../decorators/skip-tenant.decorator';
import type { PrismaService } from '@/infra/prisma/prisma.service';

const USUARIO = 'aaaaaaaa-0000-0000-0000-000000000001';
const ESCRITORIO_PROPRIO = 'bbbbbbbb-0000-0000-0000-000000000001';
const ESCRITORIO_ALHEIO = 'cccccccc-0000-0000-0000-000000000002';

function contexto(opcoes: {
  usuario?: { userId: string; email: string };
  officeId?: string;
  metadados?: Record<string, boolean>;
}): { ctx: ExecutionContext; req: Record<string, unknown> } {
  const req: Record<string, unknown> = {
    user: opcoes.usuario,
    headers: opcoes.officeId ? { 'x-office-id': opcoes.officeId } : {},
  };

  const ctx = {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => 'handler',
    getClass: () => 'classe',
  } as unknown as ExecutionContext;

  return { ctx, req };
}

function reflectorCom(metadados: Record<string, boolean> = {}): Reflector {
  return {
    getAllAndOverride: (chave: string) => metadados[chave],
  } as unknown as Reflector;
}

function prismaCom(
  vinculo: { role: string; office: { deletedAt: Date | null } } | null,
): { servico: PrismaService; consulta: ReturnType<typeof vi.fn> } {
  const consulta = vi.fn().mockResolvedValue(vinculo);
  const servico = {
    officeMember: { findUnique: consulta },
  } as unknown as PrismaService;
  return { servico, consulta };
}

describe('TenantGuard', () => {
  const usuario = { userId: USUARIO, email: 'dev@cacia.ai' };

  describe('quando o usuário é membro do escritório', () => {
    it('libera e anexa officeId e papel à requisição', async () => {
      const { servico } = prismaCom({
        role: 'ADMIN',
        office: { deletedAt: null },
      });
      const guard = new TenantGuard(reflectorCom(), servico);
      const { ctx, req } = contexto({
        usuario,
        officeId: ESCRITORIO_PROPRIO,
      });

      await expect(guard.canActivate(ctx)).resolves.toBe(true);
      expect(req.officeId).toBe(ESCRITORIO_PROPRIO);
      expect(req.officeRole).toBe('ADMIN');
    });

    it('consulta o vínculo pelo par usuário + escritório', async () => {
      const { servico, consulta } = prismaCom({
        role: 'USER',
        office: { deletedAt: null },
      });
      const guard = new TenantGuard(reflectorCom(), servico);
      const { ctx } = contexto({ usuario, officeId: ESCRITORIO_PROPRIO });

      await guard.canActivate(ctx);

      expect(consulta).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_officeId: {
              userId: USUARIO,
              officeId: ESCRITORIO_PROPRIO,
            },
          },
        }),
      );
    });
  });

  describe('isolamento entre escritórios', () => {
    it('recusa escritório do qual o usuário não é membro', async () => {
      // findUnique devolve null: não existe vínculo para este par
      const { servico } = prismaCom(null);
      const guard = new TenantGuard(reflectorCom(), servico);
      const { ctx, req } = contexto({
        usuario,
        officeId: ESCRITORIO_ALHEIO,
      });

      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
      expect(req.officeId).toBeUndefined();
    });

    it('recusa escritório excluído logicamente', async () => {
      const { servico } = prismaCom({
        role: 'ADMIN',
        office: { deletedAt: new Date() },
      });
      const guard = new TenantGuard(reflectorCom(), servico);
      const { ctx } = contexto({ usuario, officeId: ESCRITORIO_PROPRIO });

      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('dá a mesma resposta para escritório inexistente e para sem acesso', async () => {
      // Mensagens diferentes permitiriam descobrir quais escritórios existem
      const semVinculo = new TenantGuard(
        reflectorCom(),
        prismaCom(null).servico,
      );
      const excluido = new TenantGuard(
        reflectorCom(),
        prismaCom({ role: 'USER', office: { deletedAt: new Date() } }).servico,
      );

      const erroA = await semVinculo
        .canActivate(contexto({ usuario, officeId: ESCRITORIO_ALHEIO }).ctx)
        .catch((e: Error) => e.message);
      const erroB = await excluido
        .canActivate(contexto({ usuario, officeId: ESCRITORIO_PROPRIO }).ctx)
        .catch((e: Error) => e.message);

      expect(erroA).toBe(erroB);
    });
  });

  describe('origem do officeId', () => {
    it('exige o cabeçalho x-office-id', async () => {
      const { servico } = prismaCom(null);
      const guard = new TenantGuard(reflectorCom(), servico);
      const { ctx } = contexto({ usuario });

      await expect(guard.canActivate(ctx)).rejects.toThrow(BadRequestException);
    });

    it('ignora officeId vindo do corpo da requisição', async () => {
      const { servico, consulta } = prismaCom(null);
      const guard = new TenantGuard(reflectorCom(), servico);
      const { ctx, req } = contexto({ usuario });
      // Tentativa de injetar o escritório por outro caminho
      req.body = { officeId: ESCRITORIO_ALHEIO, office_id: ESCRITORIO_ALHEIO };
      req.query = { office_id: ESCRITORIO_ALHEIO };

      await expect(guard.canActivate(ctx)).rejects.toThrow(BadRequestException);
      expect(consulta).not.toHaveBeenCalled();
    });

    it('recusa cabeçalho vazio ou só com espaços', async () => {
      const { servico } = prismaCom(null);
      const guard = new TenantGuard(reflectorCom(), servico);
      const { ctx } = contexto({ usuario, officeId: '   ' });

      await expect(guard.canActivate(ctx)).rejects.toThrow(BadRequestException);
    });
  });

  describe('requisição sem usuário autenticado', () => {
    it('recusa mesmo com cabeçalho de escritório presente', async () => {
      const { servico, consulta } = prismaCom({
        role: 'ADMIN',
        office: { deletedAt: null },
      });
      const guard = new TenantGuard(reflectorCom(), servico);
      const { ctx } = contexto({ officeId: ESCRITORIO_PROPRIO });

      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
      expect(consulta).not.toHaveBeenCalled();
    });
  });

  describe('rotas dispensadas', () => {
    it('libera rota pública sem consultar o banco', async () => {
      const { servico, consulta } = prismaCom(null);
      const guard = new TenantGuard(
        reflectorCom({ [IS_PUBLIC]: true }),
        servico,
      );
      const { ctx } = contexto({});

      await expect(guard.canActivate(ctx)).resolves.toBe(true);
      expect(consulta).not.toHaveBeenCalled();
    });

    it('libera rota com @SkipTenant sem exigir o cabeçalho', async () => {
      const { servico, consulta } = prismaCom(null);
      const guard = new TenantGuard(
        reflectorCom({ [SKIP_TENANT]: true }),
        servico,
      );
      const { ctx, req } = contexto({ usuario });

      await expect(guard.canActivate(ctx)).resolves.toBe(true);
      expect(consulta).not.toHaveBeenCalled();
      // Sem officeId: o decorator CurrentOffice falha se for usado nessa rota
      expect(req.officeId).toBeUndefined();
    });
  });
});
