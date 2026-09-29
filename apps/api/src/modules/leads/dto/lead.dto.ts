import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { LeadSource, LeadStatus } from '@cacia/database';
import { PaginacaoDto } from '@/common/dto/paginacao.dto';
import { EnderecoDoClienteDto } from '../../customers/dto/customer.dto';

const limpar = ({ value }: { value: string }) => value?.trim();

export class CriarLeadDto {
  @IsString()
  @MinLength(2)
  @Transform(limpar)
  name!: string;

  /** Identificador do contato no WhatsApp */
  @IsString()
  @MinLength(1)
  remotejid!: string;

  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() briefing?: string;

  /**
   * Etapa de entrada. Ausente significa a primeira etapa do funil padrão —
   * o mesmo caminho do lead que chega pelo WhatsApp.
   */
  @IsOptional() @IsUUID() stageId?: string;

  @IsOptional() @IsUUID() ownerId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value?: number;

  @IsOptional() @IsEnum(LeadSource) source?: LeadSource;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(limpar)
  sourceDetail?: string;

  @IsOptional() @IsDateString() expectedCloseAt?: string;

  @IsOptional() @IsArray() @IsUUID('4', { each: true }) tagIds?: string[];
}

/**
 * Edição dos dados do lead.
 *
 * `status` NÃO entra aqui: ele é projeção da etapa do funil, e aceitá-lo pelo
 * PATCH criaria um segundo caminho para mudá-lo — um que o quadro não
 * enxergaria e que não deixaria rastro no histórico. Mover é `PATCH
 * /leads/:id/stage`.
 */
export class AtualizarLeadDto {
  @IsOptional() @IsString() @MinLength(2) @Transform(limpar) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() briefing?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value?: number;

  @IsOptional() @IsEnum(LeadSource) source?: LeadSource;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(limpar)
  sourceDetail?: string;

  @IsOptional() @IsDateString() expectedCloseAt?: string;
}

export class MoverEtapaDto {
  @IsUUID() stageId!: string;

  /**
   * Obrigatório na prática quando a etapa é de perda — quem perdeu sem motivo
   * registrado é um funil que não ensina nada. A exigência fica no serviço,
   * que é quem sabe a natureza da etapa de destino.
   */
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Transform(limpar)
  lostReason?: string;
}

export class DefinirResponsavelDto {
  /** Nulo desatribui o lead. */
  @IsOptional() @IsUUID() ownerId?: string | null;
}

export class ConverterLeadDto {
  /** Cliente existente para vincular. Se ausente, um novo é criado. */
  @IsOptional() @IsUUID() customerId?: string;

  /** Obrigatório quando não há customerId — o cliente novo precisa dele. */
  @IsOptional() @IsString() document?: string;

  // ---- dados do cliente novo ---------------------------------------------
  // A tela de conversão é o cadastro completo de cliente. Sem estes campos,
  // o endereço e a razão social que a pessoa acabou de preencher eram
  // descartados em silêncio. Ausentes, valem os do lead.

  @IsOptional() @IsString() @MinLength(2) @Transform(limpar) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() tradeName?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnderecoDoClienteDto)
  addresses?: EnderecoDoClienteDto[];
}

export class ListarLeadsDto extends PaginacaoDto {
  @IsOptional() @IsEnum(LeadStatus) status?: LeadStatus;
  @IsOptional() @IsUUID() stageId?: string;
  @IsOptional() @IsUUID() pipelineId?: string;
  @IsOptional() @IsUUID() ownerId?: string;
  @IsOptional() @IsEnum(LeadSource) source?: LeadSource;

  /**
   * Etiquetas exigidas — o lead precisa ter TODAS.
   *
   * Uma etiqueta só já vem como string; com várias, o Express entrega array.
   * O `@Transform` normaliza para array nos dois casos, senão o filtro por uma
   * etiqueta compararia caractere a caractere.
   */
  @IsOptional()
  @Transform(({ value }: { value: string | string[] }) =>
    value === undefined ? undefined : Array.isArray(value) ? value : [value],
  )
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}

/**
 * Quadro: os leads agrupados por etapa.
 *
 * Cada coluna vem paginada por si — um funil com dez mil leads numa etapa não
 * pode obrigar o navegador a receber os dez mil para desenhar cinco colunas.
 */
export class QuadroDto {
  @IsOptional() @IsUUID() pipelineId?: string;
  @IsOptional() @IsUUID() ownerId?: string;

  @IsOptional()
  @Transform(({ value }: { value: string | string[] }) =>
    value === undefined ? undefined : Array.isArray(value) ? value : [value],
  )
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @IsOptional() @IsString() search?: string;

  /** Quantos cartões por coluna. */
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  porEtapa: number = 20;
}

export class MetricasDoFunilDto {
  @IsOptional() @IsUUID() pipelineId?: string;

  /** Janela de análise, em dias. */
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(365)
  dias: number = 30;
}
