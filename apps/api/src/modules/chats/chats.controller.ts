import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentOffice } from '@/auth/decorators/current-office.decorator';
import { ChatsService, type AnexoEnviado } from './chats.service';
import {
  EnviarAnexoDto,
  EnviarMensagemDto,
  ListarChatsDto,
  ListarMensagensDto,
  RespostaEmAudioDto,
} from './dto/chat.dto';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chats: ChatsService) {}

  @Get()
  listar(@CurrentOffice() officeId: string, @Query() dto: ListarChatsDto) {
    return this.chats.listar(officeId, dto);
  }

  @Get(':id')
  detalhar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chats.detalhar(officeId, id);
  }

  @Get(':id/messages')
  mensagens(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() dto: ListarMensagensDto,
  ) {
    return this.chats.listarMensagens(officeId, id, dto);
  }

  @Post(':id/messages')
  enviar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EnviarMensagemDto,
  ) {
    return this.chats.enviarMensagem(officeId, id, dto.text);
  }

  /** Arquivo, imagem ou áudio gravado na tela (multipart, campo `file`). */
  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  enviarAnexo(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() arquivo: AnexoEnviado | undefined,
    @Body() dto: EnviarAnexoDto,
  ) {
    return this.chats.enviarAnexo(officeId, id, arquivo, dto.caption);
  }

  @Post(':id/take-over')
  assumir(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chats.assumir(officeId, id);
  }

  @Post(':id/release')
  devolver(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chats.devolverParaIa(officeId, id);
  }

  @Put(':id/audio-reply')
  respostaEmAudio(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespostaEmAudioDto,
  ) {
    return this.chats.definirRespostaEmAudio(officeId, id, dto.enabled);
  }

  @Post(':id/close')
  encerrar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chats.encerrar(officeId, id);
  }
}
