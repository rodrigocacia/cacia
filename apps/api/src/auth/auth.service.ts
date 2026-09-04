import { randomInt } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { SenhaService } from './senha.service';
import type { LoginDto } from './dto/login.dto';
import type { RegistrarDto } from './dto/registrar.dto';
import type {
  RedefinirSenhaDto,
  ValidarCodigoDto,
} from './dto/recuperar-senha.dto';

/** Escritórios do usuário, com o papel dele em cada um. */
export interface EscritorioDoUsuario {
  id: string;
  name: string;
  role: string;
}

export interface RespostaAutenticacao {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  offices: EscritorioDoUsuario[];
}

const VALIDADE_CODIGO_MINUTOS = 15;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly senha: SenhaService,
  ) {}

  async registrar(dto: RegistrarDto): Promise<RespostaAutenticacao> {
    const existente = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existente) {
      throw new ConflictException('Já existe uma conta com este e-mail');
    }

    const usuario = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: await this.senha.gerarHash(dto.password),
        phone: dto.phone,
        document: dto.document,
      },
      select: { id: true, name: true, email: true, avatar: true },
    });

    return {
      token: this.assinarToken(usuario.id, usuario.email),
      user: usuario,
      offices: [],
    };
  }

  async login(dto: LoginDto): Promise<RespostaAutenticacao> {
    const usuario = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        password: true,
        memberships: {
          where: { office: { deletedAt: null } },
          select: {
            role: true,
            office: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Confere a senha mesmo quando o usuário não existe. Sem isso, o tempo de
    // resposta denuncia quais e-mails têm conta cadastrada.
    const hashParaConferir =
      usuario?.password ?? '$2b$12$invalidoinvalidoinvalidoinvalidoinvalidoinv';
    const senhaConfere = await this.senha.conferir(
      dto.password,
      hashParaConferir,
    );

    if (!usuario || !senhaConfere) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    return {
      token: this.assinarToken(usuario.id, usuario.email),
      user: {
        id: usuario.id,
        name: usuario.name,
        email: usuario.email,
        avatar: usuario.avatar,
      },
      offices: usuario.memberships.map((v) => ({
        id: v.office.id,
        name: v.office.name,
        role: v.role,
      })),
    };
  }

  /**
   * Gera um código de recuperação.
   *
   * Responde igual quando o e-mail não existe: informar a diferença
   * transformaria o endpoint em um verificador de contas cadastradas.
   */
  async solicitarCodigo(email: string): Promise<void> {
    const usuario = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: { id: true },
    });

    if (!usuario) {
      this.logger.warn(`Recuperação solicitada para e-mail sem conta`);
      return;
    }

    // randomInt do node:crypto — Math.random é previsível e não serve aqui
    const codigo = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const expiraEm = new Date(Date.now() + VALIDADE_CODIGO_MINUTOS * 60 * 1000);

    await this.prisma.user.update({
      where: { id: usuario.id },
      data: { forgotCode: codigo, forgotCodeExpireAt: expiraEm },
    });

    // TODO(fase-4): enviar por e-mail. Hoje só registra em log.
    this.logger.log(
      `Código de recuperação gerado para o usuário ${usuario.id}`,
    );
  }

  async validarCodigo(dto: ValidarCodigoDto): Promise<{ valid: boolean }> {
    const usuario = await this.buscarPorCodigo(dto.email, dto.code);
    return { valid: usuario !== null };
  }

  async redefinirSenha(dto: RedefinirSenhaDto): Promise<void> {
    const usuario = await this.buscarPorCodigo(dto.email, dto.code);

    if (!usuario) {
      throw new BadRequestException('Código inválido ou expirado');
    }

    await this.prisma.user.update({
      where: { id: usuario.id },
      data: {
        password: await this.senha.gerarHash(dto.password),
        // Invalida o código: um código só serve uma vez
        forgotCode: null,
        forgotCodeExpireAt: null,
      },
    });
  }

  private async buscarPorCodigo(
    email: string,
    codigo: string,
  ): Promise<{ id: string } | null> {
    return this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
        forgotCode: codigo,
        forgotCodeExpireAt: { gt: new Date() },
      },
      select: { id: true },
    });
  }

  private assinarToken(userId: string, email: string): string {
    return this.jwt.sign({ sub: userId, email });
  }
}
