import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
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
