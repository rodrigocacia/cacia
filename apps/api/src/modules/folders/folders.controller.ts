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
import { FoldersService } from './folders.service';
import {
  AtualizarPastaDto,
  CriarPastaDto,
  ListarPastasDto,
} from './dto/folder.dto';

@Controller('folders')
export class FoldersController {
  constructor(private readonly folders: FoldersService) {}

  @Get()
  listar(@CurrentOffice() officeId: string, @Query() dto: ListarPastasDto) {
    return this.folders.listar(officeId, dto);
  }

  @Get(':id')
  detalhar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.folders.detalhar(officeId, id);
  }

  @Post()
  criar(@CurrentOffice() officeId: string, @Body() dto: CriarPastaDto) {
    return this.folders.criar(officeId, dto);
  }

  @Patch(':id')
  atualizar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarPastaDto,
  ) {
    return this.folders.atualizar(officeId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.folders.remover(officeId, id);
  }
}
