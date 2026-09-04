import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { LeadStatus } from '@cacia/database';
import { PaginacaoDto } from '@/common/dto/paginacao.dto';

export class CriarLeadDto {
  @IsString()
  @MinLength(2)
  @Transform(({ value }: { value: string }) => value?.trim())
  name!: string;

  /** Identificador do contato no WhatsApp */
  @IsString()
  @MinLength(1)
  remotejid!: string;

  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() briefing?: string;
}

export class AtualizarLeadDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() briefing?: string;
  @IsOptional() @IsEnum(LeadStatus) status?: LeadStatus;
}

export class ConverterLeadDto {
  /** Cliente existente para vincular. Se ausente, um novo é criado. */
  @IsOptional() @IsUUID() customerId?: string;

  /** Obrigatório quando não há customerId — o cliente novo precisa dele. */
  @IsOptional() @IsString() document?: string;
}

export class ListarLeadsDto extends PaginacaoDto {
  @IsOptional() @IsEnum(LeadStatus) status?: LeadStatus;
}
