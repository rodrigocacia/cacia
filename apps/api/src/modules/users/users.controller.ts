import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { SkipTenant } from '@/auth/decorators/skip-tenant.decorator';
import type { UsuarioAutenticado } from '@/auth/tipos';
import { UsersService } from './users.service';
import { AtualizarPerfilDto } from './dto/atualizar-perfil.dto';
import { TrocarSenhaDto } from './dto/trocar-senha.dto';

/** Rotas do próprio usuário — não pertencem a nenhum escritório. */
@SkipTenant()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  perfil(@CurrentUser() usuario: UsuarioAutenticado) {
    return this.users.perfil(usuario.userId);
  }

  @Patch('me')
  atualizar(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: AtualizarPerfilDto,
  ) {
    return this.users.atualizarPerfil(usuario.userId, dto);
  }

  @Put('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  trocarSenha(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: TrocarSenhaDto,
  ): Promise<void> {
    return this.users.trocarSenha(usuario.userId, dto);
  }
}
