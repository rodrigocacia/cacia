import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

const UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

export class CriarEscritorioDto {
  @IsString()
  @MinLength(2)
  @Transform(({ value }: { value: string }) => value?.trim())
  name!: string;

  @IsOptional() @IsString() description?: string;

  /** CNPJ, apenas dígitos */
  @IsString()
  @Length(14, 14, { message: 'CNPJ deve ter 14 dígitos' })
  @Transform(({ value }: { value: string }) => value?.replace(/\D/g, ''))
  document!: string;

  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() tradeName?: string;

  @IsString()
  @MinLength(1)
  @Transform(({ value }: { value: string }) => value?.replace(/\D/g, ''))
  oabNumber!: string;

  @IsEnum(UFS, { message: 'UF inválida' })
  @Transform(({ value }: { value: string }) => value?.trim().toUpperCase())
  oabUf!: string;
}
