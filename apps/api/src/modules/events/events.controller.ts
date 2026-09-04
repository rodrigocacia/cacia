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
  Query,
} from '@nestjs/common';
import { CurrentOffice } from '@/auth/decorators/current-office.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { UsuarioAutenticado } from '@/auth/tipos';
import { EventsService } from './events.service';
import {
  AtualizarEventoDto,
  CriarEventoDto,
  ListarEventosDto,
} from './dto/event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  listar(@CurrentOffice() officeId: string, @Query() dto: ListarEventosDto) {
    return this.events.listar(officeId, dto);
  }

  @Get(':id')
  detalhar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.events.detalhar(officeId, id);
  }

  @Post()
  criar(
    @CurrentOffice() officeId: string,
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: CriarEventoDto,
  ) {
    return this.events.criar(officeId, usuario.userId, dto);
  }

  @Patch(':id')
  atualizar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarEventoDto,
  ) {
    return this.events.atualizar(officeId, id, dto);
  }

  @Post(':id/cancel')
  cancelar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.events.cancelar(officeId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.events.remover(officeId, id);
  }
}
