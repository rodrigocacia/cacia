import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentOffice } from '@/auth/decorators/current-office.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { UsuarioAutenticado } from '@/auth/tipos';
import { RemindersService } from './reminders.service';
import { CriarLembreteDto, ListarLembretesDto } from './dto/reminder.dto';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  /**
   * Lembretes que falharam em definitivo.
   *
   * Existe para tornar a falha visível: no sistema anterior um lembrete
   * perdido não aparecia em lugar nenhum.
   *
   * Declarada antes de `:id` porque a rota estática precisa vencer o
   * parâmetro — do contrário "failed" seria lido como um id.
   */
  @Get('failed')
  falhados(@CurrentOffice() officeId: string) {
    return this.reminders.listarFalhados(officeId);
  }

  /** Lembretes de um compromisso. */
  @Get()
  listar(@CurrentOffice() officeId: string, @Query() dto: ListarLembretesDto) {
    if (!dto.eventId) return [];

    return this.reminders.listarDoEvento(officeId, dto.eventId);
  }

  @Post()
  criar(
    @CurrentOffice() officeId: string,
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: CriarLembreteDto,
  ) {
    return this.reminders.criar(officeId, usuario.userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.reminders.cancelar(officeId, id);
  }
}
