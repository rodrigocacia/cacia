import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ChatStatus, ChatType } from '@cacia/database';
import { PaginacaoDto } from '@/common/dto/paginacao.dto';

export class ListarChatsDto extends PaginacaoDto {
  @IsOptional() @IsEnum(ChatStatus) status?: ChatStatus;
  @IsOptional() @IsEnum(ChatType) type?: ChatType;
}

export class ListarMensagensDto extends PaginacaoDto {}

export class RespostaEmAudioDto {
  /** null devolve o comportamento à configuração do escritório. */
  @IsOptional() @IsBoolean() enabled!: boolean | null;
}
