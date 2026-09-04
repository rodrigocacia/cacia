import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '@cacia/database';
import { CurrentOffice } from '@/auth/decorators/current-office.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { RequerPapel } from '@/auth/decorators/office-role.decorator';
import { SkipTenant } from '@/auth/decorators/skip-tenant.decorator';
import type { UsuarioAutenticado } from '@/auth/tipos';
import { OfficesService } from './offices.service';
import { CriarEscritorioDto } from './dto/criar-escritorio.dto';
import { AtualizarEscritorioDto } from './dto/atualizar-escritorio.dto';
import { AdicionarMembroDto } from './dto/adicionar-membro.dto';

@Controller('offices')
export class OfficesController {
  constructor(private readonly offices: OfficesService) {}

  // ---- rotas sem escritório definido -------------------------------------

  /** Escritórios de que o usuário participa. */
  @SkipTenant()
  @Get()
  listar(@CurrentUser() usuario: UsuarioAutenticado) {
    return this.offices.listarDoUsuario(usuario.userId);
  }

  /** Criar escritório não pode exigir escritório — é o que cria o primeiro. */
  @SkipTenant()
  @Post()
  criar(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: CriarEscritorioDto,
  ) {
    return this.offices.criar(usuario.userId, dto);
  }

  // ---- rotas do escritório atual ------------------------------------------
  // O escritório vem do cabeçalho x-office-id, já validado pelo TenantGuard

  @Get('current')
  detalhar(@CurrentOffice() officeId: string) {
    return this.offices.detalhar(officeId);
  }

  @RequerPapel(Role.ADMIN)
  @Patch('current')
  atualizar(
    @CurrentOffice() officeId: string,
    @Body() dto: AtualizarEscritorioDto,
  ) {
    return this.offices.atualizar(officeId, dto);
  }

  @Get('current/members')
  listarMembros(@CurrentOffice() officeId: string) {
    return this.offices.listarMembros(officeId);
  }

  @RequerPapel(Role.ADMIN)
  @Post('current/members')
  adicionarMembro(
    @CurrentOffice() officeId: string,
    @Body() dto: AdicionarMembroDto,
  ) {
    return this.offices.adicionarMembro(officeId, dto);
  }

  @RequerPapel(Role.ADMIN)
  @Delete('current/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removerMembro(
    @CurrentOffice() officeId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.offices.removerMembro(officeId, userId);
  }
}
