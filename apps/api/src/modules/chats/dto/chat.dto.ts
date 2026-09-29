import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ChatStatus, ChatType } from '@cacia/database';
import { PaginacaoDto } from '@/common/dto/paginacao.dto';

export class ListarChatsDto extends PaginacaoDto {
  @IsOptional() @IsEnum(ChatStatus) status?: ChatStatus;
  @IsOptional() @IsEnum(ChatType) type?: ChatType;
  /** Abre a conversa a partir da ficha do lead ou do cliente. */
  @IsOptional() @IsUUID() leadId?: string;
  @IsOptional() @IsUUID() customerId?: string;
}

export class ListarMensagensDto extends PaginacaoDto {}

export class RespostaEmAudioDto {
  /** null devolve o comportamento à configuração do escritório. */
  @IsOptional() @IsBoolean() enabled!: boolean | null;
}

export class EnviarAnexoDto {
  @IsOptional() @IsString() @MaxLength(1024) caption?: string;
}

export class EnviarMensagemDto {
  /**
   * O WhatsApp aceita textos bem maiores; o teto aqui só barra colagem
   * acidental de um documento inteiro na caixa de resposta.
   */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'Escreva a mensagem' })
  @MaxLength(4096)
  text!: string;
}
