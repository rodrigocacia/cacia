import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CriarConexaoDto {
  @IsOptional() @IsBoolean() fallbackEnabled?: boolean;

  /**
   * Localização do proxy residencial. Se omitida, usa o endereço do
   * escritório — o número deve parecer estar onde o escritório está.
   */
  @IsOptional() @IsString() proxyState?: string;
  @IsOptional() @IsString() proxyCity?: string;
}

export class TrocarProxyDto {
  @IsOptional() @IsString() @MinLength(2) state?: string;
  @IsOptional() @IsString() @MinLength(2) city?: string;
}
