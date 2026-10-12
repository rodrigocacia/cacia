import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class ResumoDto {
  /** Início do período, em ISO. Ausente, considera desde sempre. */
  @IsOptional() @IsDateString() from?: string;

  @IsOptional() @IsDateString() to?: string;
}

export class InicioDto {
  @IsOptional()
  @IsIn(['semana', 'mes', 'trimestre'])
  periodo?: 'semana' | 'mes' | 'trimestre';
}
