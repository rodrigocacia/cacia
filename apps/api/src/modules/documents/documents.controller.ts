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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentOffice } from '@/auth/decorators/current-office.decorator';
import { DocumentsService } from './documents.service';
import {
  AtualizarDocumentoDto,
  EnviarDocumentoDto,
  ListarDocumentosDto,
} from './dto/document.dto';

interface ArquivoRecebido {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  listar(@CurrentOffice() officeId: string, @Query() dto: ListarDocumentosDto) {
    return this.documents.listar(officeId, dto);
  }

  /** Documentos cuja indexação falhou — para que a falha seja visível. */
  @Get('indexing-failed')
  falhasDeIndexacao(@CurrentOffice() officeId: string) {
    return this.documents.listarComFalhaDeIndexacao(officeId);
  }

  @Get(':id')
  detalhar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.documents.detalhar(officeId, id);
  }

  /** Link temporário de 15 minutos. O arquivo é privado no storage. */
  @Get(':id/download')
  async download(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ url: string }> {
    return { url: await this.documents.gerarLinkDeDownload(officeId, id) };
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  enviar(
    @CurrentOffice() officeId: string,
    @UploadedFile() arquivo: ArquivoRecebido,
    @Body() dto: EnviarDocumentoDto,
  ) {
    return this.documents.enviar({ officeId, arquivo, ...dto });
  }

  @Patch(':id')
  atualizar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarDocumentoDto,
  ) {
    return this.documents.atualizar(officeId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.documents.remover(officeId, id);
  }
}
