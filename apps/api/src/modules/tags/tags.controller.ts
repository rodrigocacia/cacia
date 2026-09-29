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
import { TagsService } from './tags.service';
import {
  AtualizarEtiquetaDto,
  CriarEtiquetaDto,
  ListarEtiquetasDto,
} from './dto/tag.dto';

@Controller('tags')
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Get()
  listar(@CurrentOffice() officeId: string, @Query() dto: ListarEtiquetasDto) {
    return this.tags.listar(officeId, dto);
  }

  @Post()
  criar(@CurrentOffice() officeId: string, @Body() dto: CriarEtiquetaDto) {
    return this.tags.criar(officeId, dto);
  }

  @Patch(':id')
  atualizar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarEtiquetaDto,
  ) {
    return this.tags.atualizar(officeId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.tags.remover(officeId, id);
  }
}
