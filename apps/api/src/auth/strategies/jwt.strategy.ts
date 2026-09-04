import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@/infra/prisma/prisma.service';
import type { UsuarioAutenticado } from '../tipos';

interface PayloadJwt {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Confirma que o usuário do token ainda existe e não foi excluído.
   *
   * O token é válido por 7 dias; sem esta checagem, um usuário desativado
   * continuaria com acesso até o token expirar naturalmente.
   */
  async validate(payload: PayloadJwt): Promise<UsuarioAutenticado> {
    const usuario = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: { id: true, email: true, role: true },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuário inválido ou removido');
    }

    // O papel vem do banco a cada requisição, nunca do token: revogar a
    // administração de alguém precisa surtir efeito na hora, e não só quando
    // o token dele expirar.
    return {
      userId: usuario.id,
      email: usuario.email,
      role: usuario.role,
    };
  }
}
