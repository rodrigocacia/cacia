import { describe, expect, it, vi } from 'vitest';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { SenhaService } from './senha.service';
import type { PrismaService } from '@/infra/prisma/prisma.service';
import type { JwtService } from '@nestjs/jwt';

const USUARIO = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  name: 'Advogada',
  email: 'dev@cacia.ai',
  avatar: null,
  password: '$2b$12$hashvalido',
  memberships: [
    {
      role: 'ADMIN',
      office: {
        id: 'bbbbbbbb-0000-0000-0000-000000000001',
        name: 'Escritório',
      },
    },
  ],
};

function montar(opcoes: {
  usuarioEncontrado?: typeof USUARIO | null;
  senhaConfere?: boolean;
}) {
  const findFirst = vi.fn().mockResolvedValue(opcoes.usuarioEncontrado ?? null);
  const findUnique = vi.fn().mockResolvedValue(null);
  const create = vi.fn().mockResolvedValue({
    id: USUARIO.id,
    name: USUARIO.name,
    email: USUARIO.email,
    avatar: null,
  });

  const prisma = {
    user: { findFirst, findUnique, create, update: vi.fn() },
  } as unknown as PrismaService;

  const conferir = vi.fn().mockResolvedValue(opcoes.senhaConfere ?? false);
  const senha = {
    conferir,
    gerarHash: vi.fn().mockResolvedValue('$2b$12$novohash'),
  } as unknown as SenhaService;

  const jwt = {
    sign: vi.fn().mockReturnValue('token-jwt'),
  } as unknown as JwtService;

  return {
    servico: new AuthService(prisma, jwt, senha),
    findFirst,
    findUnique,
    create,
    conferir,
  };
}

describe('AuthService', () => {
  describe('login', () => {
    it('devolve token e os escritórios do usuário', async () => {
      const { servico } = montar({
        usuarioEncontrado: USUARIO,
        senhaConfere: true,
      });

      const r = await servico.login({
        email: 'dev@cacia.ai',
        password: 'senha-correta',
      });

      expect(r.token).toBe('token-jwt');
      expect(r.offices).toEqual([
        {
          id: 'bbbbbbbb-0000-0000-0000-000000000001',
          name: 'Escritório',
          role: 'ADMIN',
        },
      ]);
    });

    it('nunca devolve o hash da senha', async () => {
      const { servico } = montar({
        usuarioEncontrado: USUARIO,
        senhaConfere: true,
      });

      const r = await servico.login({
        email: 'dev@cacia.ai',
        password: 'senha-correta',
      });

      expect(JSON.stringify(r)).not.toContain('$2b$');
      expect(r.user).not.toHaveProperty('password');
    });

    it('recusa senha incorreta', async () => {
      const { servico } = montar({
        usuarioEncontrado: USUARIO,
        senhaConfere: false,
      });

      await expect(
        servico.login({ email: 'dev@cacia.ai', password: 'errada' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('confere a senha mesmo quando o e-mail não existe', async () => {
      // Retornar cedo sem calcular o hash tornaria a resposta mensuravelmente
      // mais rápida, revelando quais e-mails têm conta
      const { servico, conferir } = montar({
        usuarioEncontrado: null,
        senhaConfere: false,
      });

      await expect(
        servico.login({ email: 'ninguem@cacia.ai', password: 'qualquer' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(conferir).toHaveBeenCalledOnce();
    });

    it('dá a mesma mensagem para e-mail inexistente e senha errada', async () => {
      const semUsuario = montar({ usuarioEncontrado: null });
      const senhaErrada = montar({
        usuarioEncontrado: USUARIO,
        senhaConfere: false,
      });

      const erroA = await semUsuario.servico
        .login({ email: 'a@cacia.ai', password: 'x' })
        .catch((e: Error) => e.message);
      const erroB = await senhaErrada.servico
        .login({ email: 'dev@cacia.ai', password: 'x' })
        .catch((e: Error) => e.message);

      expect(erroA).toBe(erroB);
    });
  });

  describe('registrar', () => {
    it('recusa e-mail já cadastrado', async () => {
      const { servico, findUnique } = montar({});
      findUnique.mockResolvedValue({ id: USUARIO.id });

      await expect(
        servico.registrar({
          name: 'Fulana',
          email: 'dev@cacia.ai',
          password: 'senha-com-8',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('grava a senha com hash, nunca em texto puro', async () => {
      const { servico, create } = montar({});

      await servico.registrar({
        name: 'Fulana',
        email: 'nova@cacia.ai',
        password: 'senha-em-texto',
      });

      const dadosGravados = create.mock.calls[0]?.[0]?.data as {
        password: string;
      };
      expect(dadosGravados.password).toBe('$2b$12$novohash');
      expect(dadosGravados.password).not.toBe('senha-em-texto');
    });

    it('nasce sem escritório — o usuário cria ou é convidado depois', async () => {
      const { servico } = montar({});

      const r = await servico.registrar({
        name: 'Fulana',
        email: 'nova@cacia.ai',
        password: 'senha-com-8',
      });

      expect(r.offices).toEqual([]);
    });
  });

  describe('recuperação de senha', () => {
    it('não revela se o e-mail existe', async () => {
      const { servico } = montar({ usuarioEncontrado: null });

      // Sem erro: a resposta é a mesma para e-mail cadastrado ou não
      await expect(
        servico.solicitarCodigo('ninguem@cacia.ai'),
      ).resolves.toBeUndefined();
    });

    it('considera inválido um código expirado', async () => {
      // findFirst filtra por forgotCodeExpireAt > agora; expirado devolve null
      const { servico } = montar({ usuarioEncontrado: null });

      const r = await servico.validarCodigo({
        email: 'dev@cacia.ai',
        code: '123456',
      });

      expect(r.valid).toBe(false);
    });
  });
});
