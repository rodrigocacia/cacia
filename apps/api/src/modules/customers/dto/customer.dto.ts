import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginacaoDto } from '@/common/dto/paginacao.dto';

export class EnderecoDoClienteDto {
  @IsOptional() @IsString() cep?: string;
  @IsOptional() @IsString() street?: string;
  @IsOptional() @IsString() number?: string;
  @IsOptional() @IsString() complement?: string;
  @IsOptional() @IsString() neighborhood?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
}

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnderecoDoClienteDto)
  addresses?: EnderecoDoClienteDto[];
}

export class AtualizarClienteDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() briefing?: string;
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() tradeName?: string;
  @IsOptional() @IsString() remotejid?: string;

  /** Substituição total — a tela envia o endereço inteiro. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnderecoDoClienteDto)
  addresses?: EnderecoDoClienteDto[];
}

export class ListarClientesDto extends PaginacaoDto {}
