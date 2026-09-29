import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EnderecoDoEscritorioDto } from './atualizar-escritorio.dto';

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

  /**
   * CPF ou CNPJ, apenas dígitos. Advogado autônomo atua com o próprio CPF —
   * exigir CNPJ deixaria de fora quem não tem sociedade constituída.
   */
  @IsString()
  @Matches(/^(\d{11}|\d{14})$/, {
    message: 'Documento deve ser CPF (11 dígitos) ou CNPJ (14 dígitos)',
  })
  @Transform(({ value }: { value: string }) => value?.replace(/\D/g, ''))
  document!: string;

  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() tradeName?: string;
  @IsOptional() @IsString() remotejid?: string;

  /**
   * Endereço já no cadastro: é ele que decide a localização do proxy da
   * primeira conexão de WhatsApp — ver ConnectionsService.criar.
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnderecoDoEscritorioDto)
  addresses?: EnderecoDoEscritorioDto[];

  @IsString()
  @MinLength(1)
  @Transform(({ value }: { value: string }) => value?.replace(/\D/g, ''))
  oabNumber!: string;

  @IsEnum(UFS, { message: 'UF inválida' })
  @Transform(({ value }: { value: string }) => value?.trim().toUpperCase())
  oabUf!: string;
}
