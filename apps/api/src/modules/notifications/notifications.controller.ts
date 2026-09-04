import {
  Controller,
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
import { PaginacaoDto } from '@/common/dto/paginacao.dto';
import type { UsuarioAutenticado } from '@/auth/tipos';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  listar(
    @CurrentOffice() officeId: string,
    @CurrentUser() usuario: UsuarioAutenticado,
    @Query() dto: PaginacaoDto,
  ) {
    return this.notifications.listar(officeId, usuario.userId, dto);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  marcarComoLida(
    @CurrentOffice() officeId: string,
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.notifications.marcarComoLida(officeId, usuario.userId, id);
  }

  @Post('read-all')
  marcarTodas(
    @CurrentOffice() officeId: string,
    @CurrentUser() usuario: UsuarioAutenticado,
  ) {
    return this.notifications.marcarTodasComoLidas(officeId, usuario.userId);
  }
}
