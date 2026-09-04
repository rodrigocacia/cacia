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
  Put,
} from '@nestjs/common';
import { Role } from '@cacia/database';
import { CurrentOffice } from '@/auth/decorators/current-office.decorator';
import { RequerPapel } from '@/auth/decorators/office-role.decorator';
import { ConnectionsService } from './connections.service';
import { CriarConexaoDto, TrocarProxyDto } from './dto/connection.dto';

@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connections: ConnectionsService) {}

  @Get()
  listar(@CurrentOffice() officeId: string) {
    return this.connections.listar(officeId);
  }

  /**
   * Conexões operando sem proxy residencial.
   * Rota de diagnóstico: antes, número sem proxy só se descobria quando era bloqueado.
   */
  @Get('no-proxy')
  semProxy(@CurrentOffice() officeId: string) {
    return this.connections.listarSemProxy(officeId);
  }

  @Get(':id')
  detalhar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.connections.detalhar(officeId, id);
  }

  @Get(':id/qrcode')
  qrCode(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.connections.obterQrCode(officeId, id);
  }

  @RequerPapel(Role.ADMIN)
  @Post()
  criar(@CurrentOffice() officeId: string, @Body() dto: CriarConexaoDto) {
    return this.connections.criar(officeId, dto);
  }

  @RequerPapel(Role.ADMIN)
  @Put(':id/proxy')
  trocarProxy(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TrocarProxyDto,
  ) {
    return this.connections.trocarProxy(officeId, id, dto);
  }

  @RequerPapel(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  desconectar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.connections.desconectar(officeId, id);
  }
}
