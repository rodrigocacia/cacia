import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Role } from '@cacia/database';
import { CurrentOffice } from '@/auth/decorators/current-office.decorator';
import { RequerPapel } from '@/auth/decorators/office-role.decorator';
import { SettingsService } from './settings.service';
import { AtualizarConfiguracaoDto } from './dto/setting.dto';

/**
 * Uma configuração por escritório — daí não haver `:id` na rota. O escritório
 * vem do cabeçalho, e receber o id pela URL só abriria caminho para pedir o
 * de outro.
 */
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  obter(@CurrentOffice() officeId: string) {
    return this.settings.obter(officeId);
  }

  @RequerPapel(Role.ADMIN)
  @Patch()
  atualizar(
    @CurrentOffice() officeId: string,
    @Body() dto: AtualizarConfiguracaoDto,
  ) {
    return this.settings.atualizar(officeId, dto);
  }
}
