import {
  IsArray,
  IsHexColor,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginacaoDto } from '@/common/dto/paginacao.dto';

const limpar = ({ value }: { value: string }) => value?.trim();

export class CriarEtiquetaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  @Transform(limpar)
  name!: string;

  @IsOptional() @IsHexColor() color?: string;
}

export class AtualizarEtiquetaDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  @Transform(limpar)
  name?: string;

  @IsOptional() @IsHexColor() color?: string;
}

export class ListarEtiquetasDto extends PaginacaoDto {}

/**
 * Conjunto completo de etiquetas do registro.
 *
 * Substitui, não acrescenta: mandar a lista inteira torna a operação
 * idempotente e dispensa uma rota de remover uma a uma. A tela já tem o
 * conjunto na mão de qualquer forma.
 */
export class DefinirEtiquetasDto {
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds!: string[];
}
