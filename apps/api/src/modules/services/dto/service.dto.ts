import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ServiceArea, ServiceValueType } from '@cacia/database';
import { PaginacaoDto } from '@/common/dto/paginacao.dto';
import {
  BooleanoOpcional,
  type BooleanoDaQuery,
} from '@/common/dto/booleano-da-query';

export class CriarServicoDto {
  @IsString()
  @MinLength(2)
  @Transform(({ value }: { value: string }) => value?.trim())
  title!: string;

  @IsString()
  @MinLength(2)
  description!: string;

  @IsEnum(ServiceArea, { message: 'Área jurídica inválida' })
  area!: ServiceArea;

  @IsEnum(ServiceValueType, { message: 'Tipo de valor inválido' })
  valueType!: ServiceValueType;

  /** Obrigatório quando o tipo é FIXED — ver a validação no serviço. */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) valueFixed?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) valueFloat?: number;

  /** Texto livre para quando o valor não é um número — "sob consulta". */
  @IsOptional() @IsString() valueDetail?: string;

  @IsOptional() @IsBoolean() status?: boolean;
}

export class AtualizarServicoDto {
  @IsOptional() @IsString() @MinLength(2) title?: string;
  @IsOptional() @IsString() @MinLength(2) description?: string;
  @IsOptional() @IsEnum(ServiceArea) area?: ServiceArea;
  @IsOptional() @IsEnum(ServiceValueType) valueType?: ServiceValueType;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) valueFixed?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) valueFloat?: number;
  @IsOptional() @IsString() valueDetail?: string;
  @IsOptional() @IsBoolean() status?: boolean;
}

export class ListarServicosDto extends PaginacaoDto {
  @IsOptional() @IsEnum(ServiceArea) area?: ServiceArea;

  /** Texto, não booleano — ver booleano-da-query.ts. */
  @BooleanoOpcional() status?: BooleanoDaQuery;
}
