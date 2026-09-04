import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Como o escritório cobra a consulta inicial.
 *
 * Entra no bloco estático do prompt: é por aqui que o agente sabe se deve
 * informar um valor antes de agendar.
 */
export class AtualizarConsultaDto {
  @IsOptional() @IsBoolean() isCharged?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  consultationValue?: number;

  @IsOptional() @IsBoolean() requiresPaymentToSchedule?: boolean;

  /** Chave PIX para o pagamento da consulta. */
  @IsOptional() @IsString() lawyerPixKey?: string;
}
