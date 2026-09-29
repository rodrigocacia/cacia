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
  Put,
  Query,
} from '@nestjs/common';
import { CurrentOffice } from '@/auth/decorators/current-office.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { UsuarioAutenticado } from '@/auth/tipos';
import { DefinirEtiquetasDto } from '../tags/dto/tag.dto';
import { LeadsService } from './leads.service';
import {
  AtualizarLeadDto,
  ConverterLeadDto,
  CriarLeadDto,
  DefinirResponsavelDto,
  ListarLeadsDto,
  MetricasDoFunilDto,
  MoverEtapaDto,
  QuadroDto,
} from './dto/lead.dto';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  listar(@CurrentOffice() officeId: string, @Query() dto: ListarLeadsDto) {
    return this.leads.listar(officeId, dto);
  }

  /**
   * Declarado ANTES de `:id` de propósito: o Nest casa na ordem, e `:id`
   * engoliria `/leads/board` — que então falharia no ParseUUIDPipe.
   */
  @Get('board')
  quadro(@CurrentOffice() officeId: string, @Query() dto: QuadroDto) {
    return this.leads.quadro(officeId, dto);
  }

  @Get('funnel-metrics')
  metricas(
    @CurrentOffice() officeId: string,
    @Query() dto: MetricasDoFunilDto,
  ) {
    return this.leads.metricas(officeId, dto);
  }

  @Get(':id')
  detalhar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.leads.detalhar(officeId, id);
  }

  @Post()
  criar(
    @CurrentOffice() officeId: string,
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: CriarLeadDto,
  ) {
    return this.leads.criar(officeId, dto, usuario.userId);
  }

  @Patch(':id')
  atualizar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarLeadDto,
  ) {
    return this.leads.atualizar(officeId, id, dto);
  }

  @Patch(':id/stage')
  moverEtapa(
    @CurrentOffice() officeId: string,
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoverEtapaDto,
  ) {
    return this.leads.moverEtapa(officeId, id, dto, usuario.userId);
  }

  @Patch(':id/owner')
  definirResponsavel(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DefinirResponsavelDto,
  ) {
    return this.leads.definirResponsavel(officeId, id, dto);
  }

  @Put(':id/tags')
  definirEtiquetas(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DefinirEtiquetasDto,
  ) {
    return this.leads.definirEtiquetas(officeId, id, dto.tagIds);
  }

  @Post(':id/convert')
  converter(
    @CurrentOffice() officeId: string,
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConverterLeadDto,
  ) {
    return this.leads.converter(officeId, id, dto, usuario.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.leads.remover(officeId, id);
  }
}
