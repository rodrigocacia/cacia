import { IsEnum, IsOptional } from 'class-validator';
import { NotificationType } from '@cacia/database';
import { PaginacaoDto } from '@/common/dto/paginacao.dto';

export class ListarNotificacoesDto extends PaginacaoDto {
  /** As abas da tela de notificações filtram por tipo. */
  @IsOptional() @IsEnum(NotificationType) type?: NotificationType;
}
