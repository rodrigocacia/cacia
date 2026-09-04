import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CurrentOffice } from '@/auth/decorators/current-office.decorator';
import { RemindersService } from './reminders.service';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  /**
   * Lembretes que falharam em definitivo.
   *
   * Existe para tornar a falha visível: no sistema anterior um lembrete
   * perdido não aparecia em lugar nenhum, e ninguém ficava sabendo.
   */
  @Get('failed')
  falhados(@CurrentOffice() officeId: string) {
    return this.reminders.listarFalhados(officeId);
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
