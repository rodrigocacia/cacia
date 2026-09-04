import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentOffice } from '@/auth/decorators/current-office.decorator';
import { ChatsService } from './chats.service';
import {
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
