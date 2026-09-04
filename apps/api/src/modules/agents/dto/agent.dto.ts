import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { AgentGender, AgentStyle, AgentType } from '@cacia/database';

export class CriarAgenteDto {
  @IsEnum(AgentType) type!: AgentType;

  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsEnum(AgentGender) gender?: AgentGender;

  @IsEnum(AgentStyle) style!: AgentStyle;

  /** Primeira frase que o agente envia ao iniciar um atendimento. */
  @IsString() @MinLength(5) greeting!: string;
}

export class AtualizarAgenteDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsEnum(AgentGender) gender?: AgentGender;
  @IsOptional() @IsEnum(AgentStyle) style?: AgentStyle;
  @IsOptional() @IsString() @MinLength(5) greeting?: string;
}
