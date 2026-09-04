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
import { PaginacaoDto } from '@/common/dto/paginacao.dto';
import { ProcessesService } from './processes.service';
import {
  AtualizarProcessoDto,
  CriarProcessoDto,
  ListarProcessosDto,
} from './dto/process.dto';

@Controller('processes')
export class ProcessesController {
  constructor(private readonly processes: ProcessesService) {}

  @Get()
  listar(@CurrentOffice() officeId: string, @Query() dto: ListarProcessosDto) {
    return this.processes.listar(officeId, dto);
  }

  @Get(':id')
  detalhar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.processes.detalhar(officeId, id);
  }

  @Get(':id/progresses')
  andamentos(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() dto: PaginacaoDto,
  ) {
    return this.processes.listarAndamentos(officeId, id, dto);
  }

  @Post()
  criar(@CurrentOffice() officeId: string, @Body() dto: CriarProcessoDto) {
    return this.processes.criar(officeId, dto);
  }

  @Patch(':id')
  atualizar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarProcessoDto,
  ) {
    return this.processes.atualizar(officeId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.processes.remover(officeId, id);
  }
}
