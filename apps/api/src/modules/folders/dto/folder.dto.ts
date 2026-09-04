import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginacaoDto } from '@/common/dto/paginacao.dto';

export class CriarPastaDto {
  @IsString()
  @MinLength(1)
  @Transform(({ value }: { value: string }) => value?.trim())
  title!: string;

  /** Pasta de um cliente específico. Ausente, é pasta geral do escritório. */
  @IsOptional() @IsUUID() customerId?: string;
}

export class AtualizarPastaDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @Transform(({ value }: { value: string }) => value?.trim())
  title?: string;
}

export class ListarPastasDto extends PaginacaoDto {
  @IsOptional() @IsUUID() customerId?: string;
}
