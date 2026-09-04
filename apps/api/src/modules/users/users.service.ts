import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { SenhaService } from '@/auth/senha.service';
import type { AtualizarPerfilDto } from './dto/atualizar-perfil.dto';
import type { TrocarSenhaDto } from './dto/trocar-senha.dto';

/** Campos devolvidos ao cliente. A senha nunca entra aqui. */
const CAMPOS_PUBLICOS = {
  id: true,
  name: true,
  email: true,
  document: true,
  birthday: true,
  phone: true,
  avatar: true,
  thumb: true,
  country: true,
  state: true,
  city: true,
  role: true,
  verified: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly senha: SenhaService,
  ) {}

  async perfil(userId: string) {
    const usuario = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        ...CAMPOS_PUBLICOS,
        memberships: {
          where: { office: { deletedAt: null } },
          select: {
            role: true,
            office: {
              select: { id: true, name: true, status: true, onboarding: true },
            },
          },
        },
      },
    });

    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    const { memberships, ...dados } = usuario;
    return {
      ...dados,
      offices: memberships.map((v) => ({ ...v.office, role: v.role })),
    };
  }

  async atualizarPerfil(userId: string, dto: AtualizarPerfilDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: CAMPOS_PUBLICOS,
    });
  }

  async trocarSenha(userId: string, dto: TrocarSenhaDto): Promise<void> {
    const usuario = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, password: true },
    });

    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    const confere = await this.senha.conferir(
      dto.currentPassword,
      usuario.password,
    );

    if (!confere) {
      throw new BadRequestException('Senha atual incorreta');
    }

    await this.prisma.user.update({
      where: { id: usuario.id },
      data: { password: await this.senha.gerarHash(dto.newPassword) },
    });
  }
}
