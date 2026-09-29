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
import { CalendarsService } from './calendars.service';
import { DisponibilidadeService } from './disponibilidade.service';
import { AtualizarAgendaDto, CriarAgendaDto } from './dto/calendar.dto';
import { HorariosLivresDto } from './dto/disponibilidade.dto';

@Controller('calendars')
export class CalendarsController {
  constructor(
    private readonly calendars: CalendarsService,
    private readonly disponibilidade: DisponibilidadeService,
  ) {}

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

  /**
   * Horários livres do dia, já descontados os compromissos existentes.
   *
   * É o que a tela de agendamento oferece para escolher, em vez de um campo de
   * data e hora livre — que aceitava três da manhã de domingo.
   */
  @Get(':id/availability')
  horariosLivres(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() dto: HorariosLivresDto,
  ) {
    return this.disponibilidade.doDia(
      officeId,
      id,
      dto.date,
      dto.duracaoMinutos,
    );
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
