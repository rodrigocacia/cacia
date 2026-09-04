import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class EnderecoDoEscritorioDto {
  @IsOptional() @IsString() cep?: string;
  @IsOptional() @IsString() street?: string;
  @IsOptional() @IsString() number?: string;
  @IsOptional() @IsString() complement?: string;
  @IsOptional() @IsString() neighborhood?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
}

/**
 * CNPJ e OAB ficam de fora: identificam o escritório perante o gateway de
 * pagamento e a OAB. Alterá-los é operação de suporte, não de autoatendimento.
 */
export class AtualizarEscritorioDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @Transform(({ value }: { value: string }) => value?.trim())
  name?: string;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() tradeName?: string;
  @IsOptional() @IsString() remotejid?: string;

  /** Marca a configuração inicial como concluída. */
  @IsOptional() @IsBoolean() onboarding?: boolean;

  /**
   * Endereço do escritório.
   *
   * Não é só cadastro: é o que decide a localização do proxy residencial das
   * sessões de WhatsApp — o número precisa parecer estar onde o escritório
   * está. Ver ConnectionsService.criar.
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnderecoDoEscritorioDto)
  addresses?: EnderecoDoEscritorioDto[];
}
