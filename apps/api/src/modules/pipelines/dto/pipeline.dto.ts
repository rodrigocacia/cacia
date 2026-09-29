import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsHexColor,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { StageKind } from '@cacia/database';

const limpar = ({ value }: { value: string }) => value?.trim();

export class CriarFunilDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Transform(limpar)
  name!: string;

  /**
   * Quando ausente, o funil nasce com as cinco etapas padrão. Um funil sem
   * etapa nenhuma é uma coluna vazia na tela e um lead sem para onde ir.
   */
  @IsOptional() @IsBoolean() semEtapasPadrao?: boolean;
}

export class AtualizarFunilDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Transform(limpar)
  name?: string;

  /** Marcar como padrão desmarca o anterior — sempre existe exatamente um. */
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class CriarEtapaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  @Transform(limpar)
  name!: string;

  @IsOptional() @IsHexColor() color?: string;

  @IsOptional() @IsEnum(StageKind) kind?: StageKind;
}

export class AtualizarEtapaDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  @Transform(limpar)
  name?: string;

  @IsOptional() @IsHexColor() color?: string;

  @IsOptional() @IsEnum(StageKind) kind?: StageKind;
}

/**
 * Nova ordem das etapas, da primeira à última.
 *
 * A lista inteira, não um par (id, posição): reordenar uma coluna só e deixar
 * o servidor deduzir o resto é onde nascem duas etapas na mesma posição.
 */
export class ReordenarEtapasDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  stageIds!: string[];
}
