import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ProcessStatus, ProcessType } from '@cacia/database';
import { PaginacaoDto } from '@/common/dto/paginacao.dto';

export class CriarProcessoDto {
  @IsUUID()
  customerId!: string;

  /** Número CNJ, apenas dígitos */
  @IsString()
  @Length(20, 20, { message: 'O número CNJ tem 20 dígitos' })
  @Transform(({ value }: { value: string }) => value?.replace(/\D/g, ''))
  number!: string;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsEnum(ProcessType) type?: ProcessType;
}

export class AtualizarProcessoDto {
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsEnum(ProcessType) type?: ProcessType;
  @IsOptional() @IsEnum(ProcessStatus) status?: ProcessStatus;
}

export class ListarProcessosDto extends PaginacaoDto {
  @IsOptional() @IsEnum(ProcessStatus) status?: ProcessStatus;
  @IsOptional() @IsUUID() customerId?: string;
}

/**
 * Andamento lançado à mão.
 *
 * Os que vêm da Judit chegam pelo webhook e trazem `stepId`. Este é o do
 * advogado, que registra o que aconteceu fora do sistema — uma audiência, uma
 * conversa com a parte contrária.
 */
export class CriarAndamentoDto {
  @IsString()
  @MinLength(2)
  @Transform(({ value }: { value: string }) => value?.trim())
  description!: string;

  @IsOptional() @IsString() title?: string;

  /** Quando o andamento aconteceu. Ausente, vale agora. */
  @IsOptional() @IsDateString() releaseAt?: string;
}
