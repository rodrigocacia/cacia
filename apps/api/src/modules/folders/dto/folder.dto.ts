import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
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

/**
 * As quatro ordens que o seletor "Ordenar por" da tela de documentos oferece.
 * Os valores são os que a interface já usava; o enum existe para que um valor
 * fora da lista vire 400 aqui, e não um `orderBy` inventado no Prisma.
 */
export enum OrdemDasPastas {
  NOME_ASC = 'name_asc',
  NOME_DESC = 'name_desc',
  MAIS_NOVAS = 'newest',
  MAIS_ANTIGAS = 'oldest',
}

export class ListarPastasDto extends PaginacaoDto {
  @IsOptional() @IsUUID() customerId?: string;

  @IsOptional() @IsEnum(OrdemDasPastas) sortBy?: OrdemDasPastas;
}
