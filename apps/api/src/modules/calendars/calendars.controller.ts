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
import { CurrentOffice } from '@/auth/decorators/current-office.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { UsuarioAutenticado } from '@/auth/tipos';
import { CalendarsService } from './calendars.service';
import { AtualizarAgendaDto, CriarAgendaDto } from './dto/calendar.dto';

@Controller('calendars')
export class CalendarsController {
  constructor(private readonly calendars: CalendarsService) {}

  @Get()
  listar(@CurrentOffice() officeId: string) {
    return this.calendars.listar(officeId);
  }

  @Get(':id')
  detalhar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.calendars.detalhar(officeId, id);
  }

  @Post()
  criar(
    @CurrentOffice() officeId: string,
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: CriarAgendaDto,
  ) {
    return this.calendars.criar(officeId, usuario.userId, dto);
  }

  @Patch(':id')
  atualizar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarAgendaDto,
  ) {
    return this.calendars.atualizar(officeId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.calendars.remover(officeId, id);
  }
}
