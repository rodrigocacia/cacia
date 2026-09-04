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
import { ServicesService } from './services.service';
import {
  AtualizarServicoDto,
  CriarServicoDto,
  ListarServicosDto,
} from './dto/service.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  listar(@CurrentOffice() officeId: string, @Query() dto: ListarServicosDto) {
    return this.services.listar(officeId, dto);
  }

  @Get(':id')
  detalhar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.services.detalhar(officeId, id);
  }

  @Post()
  criar(@CurrentOffice() officeId: string, @Body() dto: CriarServicoDto) {
    return this.services.criar(officeId, dto);
  }

  @Patch(':id')
  atualizar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarServicoDto,
  ) {
    return this.services.atualizar(officeId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.services.remover(officeId, id);
  }
}
