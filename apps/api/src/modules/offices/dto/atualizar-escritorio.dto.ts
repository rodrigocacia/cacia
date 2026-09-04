import { IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

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
}
