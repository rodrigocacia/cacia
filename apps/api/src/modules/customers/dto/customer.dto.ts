import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginacaoDto } from '@/common/dto/paginacao.dto';

export class CriarClienteDto {
  @IsString()
  @MinLength(2)
  @Transform(({ value }: { value: string }) => value?.trim())
  name!: string;

  /** CPF ou CNPJ, apenas dígitos */
  @IsString()
  @Length(11, 14)
  @Transform(({ value }: { value: string }) => value?.replace(/\D/g, ''))
  document!: string;

  /** Identificador do contato no WhatsApp */
  @IsString()
  @MinLength(1)
  remotejid!: string;

  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() briefing?: string;
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() tradeName?: string;
}

export class AtualizarClienteDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() briefing?: string;
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() tradeName?: string;
  @IsOptional() @IsString() remotejid?: string;
}

export class ListarClientesDto extends PaginacaoDto {}
