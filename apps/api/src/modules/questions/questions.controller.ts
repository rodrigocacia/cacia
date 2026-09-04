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
import { QuestionsService } from './questions.service';
import {
  AtualizarPerguntaDto,
  CriarPerguntaDto,
  ListarPerguntasDto,
} from './dto/question.dto';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questions: QuestionsService) {}

  @Get()
  listar(@CurrentOffice() officeId: string, @Query() dto: ListarPerguntasDto) {
    return this.questions.listar(officeId, dto);
  }

  @Get(':id')
  detalhar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.questions.detalhar(officeId, id);
  }

  @Post()
  criar(@CurrentOffice() officeId: string, @Body() dto: CriarPerguntaDto) {
    return this.questions.criar(officeId, dto);
  }

  @Patch(':id')
  atualizar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarPerguntaDto,
  ) {
    return this.questions.atualizar(officeId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.questions.remover(officeId, id);
  }
}
