import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { PromptService } from '@/ai/agente/prompt.service';
import type { CriarEscritorioDto } from './dto/criar-escritorio.dto';
import type { AtualizarEscritorioDto } from './dto/atualizar-escritorio.dto';
import type { AdicionarMembroDto } from './dto/adicionar-membro.dto';

const CAMPOS_PUBLICOS = {
  id: true,
  name: true,
  description: true,
  document: true,
  legalName: true,
  tradeName: true,
  remotejid: true,
  oabNumber: true,
  oabUf: true,
  status: true,
  onboarding: true,
  createdAt: true,
  addresses: {
    select: {
      id: true,
      cep: true,
      street: true,
      number: true,
      complement: true,
      neighborhood: true,
      city: true,
      state: true,
    },
  },
} as const;

@Injectable()
export class OfficesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prompt: PromptService,
  ) {}

  /** Escritórios de que o usuário é membro. */
  async listarDoUsuario(userId: string) {
    const vinculos = await this.prisma.officeMember.findMany({
      where: { userId, office: { deletedAt: null } },
      select: { role: true, office: { select: CAMPOS_PUBLICOS } },
      orderBy: { createdAt: 'asc' },
    });

    return vinculos.map((v) => ({ ...v.office, role: v.role }));
  }

  /**
   * Cria o escritório e o vínculo do dono na mesma transação.
   *
   * Sem transação, uma falha entre as duas escritas deixaria um escritório
   * sem nenhum membro — inacessível até para quem o criou, já que o
   * TenantGuard valida o acesso por office_members.
   */
  async criar(userId: string, dto: CriarEscritorioDto) {
    const duplicado = await this.prisma.office.findFirst({
      where: {
        document: dto.document,
        oabNumber: dto.oabNumber,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (duplicado) {
      throw new ConflictException(
        'Já existe um escritório com este CNPJ e número de OAB',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const escritorio = await tx.office.create({
        data: {
          ownerId: userId,
          name: dto.name,
          description: dto.description,
          document: dto.document,
          legalName: dto.legalName,
          tradeName: dto.tradeName,
          oabNumber: dto.oabNumber,
          oabUf: dto.oabUf,
        },
        select: CAMPOS_PUBLICOS,
      });

      await tx.officeMember.create({
        data: { userId, officeId: escritorio.id, role: Role.ADMIN },
      });

      // Um registro por escritório — criados junto para não haver escritório
      // sem configuração, o que exigiria tratar o caso nulo em todo lugar.
      await tx.setting.create({ data: { officeId: escritorio.id } });
      await tx.consultation.create({ data: { officeId: escritorio.id } });

      return { ...escritorio, role: Role.ADMIN };
    });
  }

  async detalhar(officeId: string) {
    const escritorio = await this.prisma.office.findFirst({
      where: { id: officeId, deletedAt: null },
      select: { ...CAMPOS_PUBLICOS, addresses: true },
    });

    if (!escritorio) throw new NotFoundException('Escritório não encontrado');

    return escritorio;
  }

  async atualizar(officeId: string, dto: AtualizarEscritorioDto) {
    const { addresses, ...dadosDoEscritorio } = dto;

    const escritorio = await this.prisma.$transaction(async (tx) => {
      if (addresses) {
        // Substituição total: a tela envia o endereço inteiro, e um merge
        // parcial deixaria o bairro antigo junto da rua nova.
        await tx.officeAddress.deleteMany({ where: { officeId } });

        if (addresses.length > 0) {
          await tx.officeAddress.createMany({
            data: addresses.map((endereco) => ({ ...endereco, officeId })),
          });
        }
      }

      return tx.office.update({
        where: { id: officeId },
        data: dadosDoEscritorio,
        select: CAMPOS_PUBLICOS,
      });
    });

    // O nome do escritório abre o prompt do agente. Sem invalidar, ele
    // continuaria se apresentando pelo nome antigo por até 15 minutos.
    await this.prompt.invalidar(officeId);

    return escritorio;
  }

  async listarMembros(officeId: string) {
    const membros = await this.prisma.officeMember.findMany({
      where: { officeId, user: { deletedAt: null } },
      select: {
        role: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return membros.map((m) => ({
      ...m.user,
      role: m.role,
      memberSince: m.createdAt,
    }));
  }

  async adicionarMembro(officeId: string, dto: AdicionarMembroDto) {
    const usuario = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      select: { id: true, name: true, email: true, avatar: true },
    });

    if (!usuario) {
      throw new NotFoundException('Não há usuário cadastrado com este e-mail');
    }

    const jaEhMembro = await this.prisma.officeMember.findUnique({
      where: { userId_officeId: { userId: usuario.id, officeId } },
      select: { userId: true },
    });

    if (jaEhMembro) {
      throw new ConflictException('Este usuário já é membro do escritório');
    }

    await this.prisma.officeMember.create({
      data: { userId: usuario.id, officeId, role: dto.role },
    });

    return { ...usuario, role: dto.role };
  }

  /**
   * Remove um membro.
   *
   * O dono não pode ser removido: ele responde pelo escritório no gateway de
   * pagamento, e sem membros o escritório fica inacessível.
   */
  async removerMembro(officeId: string, userId: string): Promise<void> {
    const escritorio = await this.prisma.office.findUniqueOrThrow({
      where: { id: officeId },
      select: { ownerId: true },
    });

    if (escritorio.ownerId === userId) {
      throw new BadRequestException(
        'O dono do escritório não pode ser removido',
      );
    }

    const vinculo = await this.prisma.officeMember.findUnique({
      where: { userId_officeId: { userId, officeId } },
      select: { id: true },
    });

    if (!vinculo) {
      throw new NotFoundException('Este usuário não é membro do escritório');
    }

    await this.prisma.officeMember.delete({ where: { id: vinculo.id } });
  }
}
