import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Matches, Max, Min } from 'class-validator';

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const MENSAGEM_DATA = 'Use o formato AAAA-MM-DD';

export class PeriodoDeConsumoDto {
  @IsOptional() @Matches(DATA, { message: MENSAGEM_DATA }) from?: string;
  @IsOptional() @Matches(DATA, { message: MENSAGEM_DATA }) to?: string;
}

export class ParametrosDeCobrancaDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  margemPercentual?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.01)
  @Max(100)
  cambio?: number;
}

export class PrecoDeModeloDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  entradaUsdPorMilhao!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  entradaEmCacheUsdPorMilhao!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  saidaUsdPorMilhao!: number;
}
