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
} from '@nestjs/common';
import { CurrentOffice } from '@/auth/decorators/current-office.decorator';
import { AgentsService } from './agents.service';
import { AtualizarAgenteDto, CriarAgenteDto } from './dto/agent.dto';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Get()
  listar(@CurrentOffice() officeId: string) {
    return this.agents.listar(officeId);
  }

  @Get(':id')
  detalhar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.agents.detalhar(officeId, id);
  }

  @Post()
  criar(@CurrentOffice() officeId: string, @Body() dto: CriarAgenteDto) {
    return this.agents.criar(officeId, dto);
  }

  @Patch(':id')
  atualizar(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarAgenteDto,
  ) {
    return this.agents.atualizar(officeId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remover(
    @CurrentOffice() officeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.agents.remover(officeId, id);
  }
}
