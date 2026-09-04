import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Role } from '@cacia/database';
import { CurrentOffice } from '@/auth/decorators/current-office.decorator';
import { RequerPapel } from '@/auth/decorators/office-role.decorator';
import { ConsultationsService } from './consultations.service';
import { AtualizarConsultaDto } from './dto/consultation.dto';

/** Uma consulta por escritório — o escritório vem do cabeçalho, não da URL. */
@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultations: ConsultationsService) {}

  @Get()
  obter(@CurrentOffice() officeId: string) {
    return this.consultations.obter(officeId);
  }

  @RequerPapel(Role.ADMIN)
  @Patch()
  atualizar(
    @CurrentOffice() officeId: string,
    @Body() dto: AtualizarConsultaDto,
  ) {
    return this.consultations.atualizar(officeId, dto);
  }
}
