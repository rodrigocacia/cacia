import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentOffice } from '@/auth/decorators/current-office.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { UsuarioAutenticado } from '@/auth/tipos';
import {
  LeadImportsService,
  type ArquivoRecebido,
} from './lead-imports.service';
import {
  ConfirmarImportacaoDto,
  ListarImportacoesDto,
} from './dto/lead-import.dto';

/**
 * Importação de leads por planilha.
 *
 * Prefixo próprio, e NÃO `/leads/import`: `@Get(':id')` do LeadsController
 * casaria com "import" e a requisição morreria no ParseUUIDPipe. Dava para
 * contornar registrando este módulo antes — mas a ordem real não é a do
 * `app.module`: o IaModule importa o LeadsModule, e o Nest registra as rotas
 * seguindo o grafo. Um teste de ponta a ponta comprovou o 400.
 *
 * Depender de ordem de registro para um caminho funcionar é o tipo de amarra
 * que se rompe sozinha quando alguém acrescenta um import em outro módulo.
 */
@Controller('lead-imports')
export class LeadImportsController {
  constructor(private readonly importacoes: LeadImportsService) {}

  @Get()
  listar(
    @CurrentOffice() officeId: string,
    @Query() dto: ListarImportacoesDto,
  ) {
    return this.importacoes.listar(officeId, dto);
  }

  @Get(':id')
  detalhar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.importacoes.detalhar(officeId, id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  prever(
    @CurrentOffice() officeId: string,
    @CurrentUser() usuario: UsuarioAutenticado,
    @UploadedFile() arquivo: ArquivoRecebido | undefined,
  ) {
    return this.importacoes.prever(officeId, usuario.userId, arquivo);
  }

  @Post(':id/confirm')
  confirmar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmarImportacaoDto,
  ) {
    return this.importacoes.confirmar(officeId, id, dto);
  }

  @Post(':id/cancel')
  cancelar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.importacoes.cancelar(officeId, id);
  }
}
