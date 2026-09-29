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
} from '@nestjs/common';
import { Role } from '@cacia/database';
import { CurrentOffice } from '@/auth/decorators/current-office.decorator';
import { RequerPapel } from '@/auth/decorators/office-role.decorator';
import { PipelinesService } from './pipelines.service';
import {
  AtualizarEtapaDto,
  AtualizarFunilDto,
  CriarEtapaDto,
  CriarFunilDto,
  ReordenarEtapasDto,
} from './dto/pipeline.dto';

/**
 * Funis e etapas.
 *
 * Ler é de qualquer membro — o quadro precisa das colunas. Alterar o desenho
 * do funil é de administrador: mexer numa etapa move o `status` de todos os
 * leads que estão nela.
 */
@Controller('pipelines')
export class PipelinesController {
  constructor(private readonly pipelines: PipelinesService) {}

  @Get()
  listar(@CurrentOffice() officeId: string) {
    return this.pipelines.listar(officeId);
  }

  @Get(':id')
  detalhar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.pipelines.detalhar(officeId, id);
  }

  @RequerPapel(Role.ADMIN)
  @Post()
  criar(@CurrentOffice() officeId: string, @Body() dto: CriarFunilDto) {
    return this.pipelines.criar(officeId, dto);
  }

  @RequerPapel(Role.ADMIN)
  @Patch(':id')
  atualizar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarFunilDto,
  ) {
    return this.pipelines.atualizar(officeId, id, dto);
  }

  @RequerPapel(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.pipelines.remover(officeId, id);
  }

  @RequerPapel(Role.ADMIN)
  @Post(':id/stages')
  criarEtapa(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CriarEtapaDto,
  ) {
    return this.pipelines.criarEtapa(officeId, id, dto);
  }

  @RequerPapel(Role.ADMIN)
  @Put(':id/stages/reorder')
  reordenarEtapas(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReordenarEtapasDto,
  ) {
    return this.pipelines.reordenarEtapas(officeId, id, dto);
  }

  @RequerPapel(Role.ADMIN)
  @Patch('stages/:stageId')
  atualizarEtapa(
    @CurrentOffice() officeId: string,
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Body() dto: AtualizarEtapaDto,
  ) {
    return this.pipelines.atualizarEtapa(officeId, stageId, dto);
  }

  @RequerPapel(Role.ADMIN)
  @Delete('stages/:stageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removerEtapa(
    @CurrentOffice() officeId: string,
    @Param('stageId', ParseUUIDPipe) stageId: string,
  ): Promise<void> {
    return this.pipelines.removerEtapa(officeId, stageId);
  }
}
