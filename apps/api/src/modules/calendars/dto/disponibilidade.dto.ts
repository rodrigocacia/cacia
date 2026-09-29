import { IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class HorariosLivresDto {
  /**
   * Dia a consultar, no fuso do escritório.
   *
   * Data pura, não instante: "2026-09-15T00:00:00Z" é 21h do dia 14 em São
   * Paulo, e a tela pediria os horários do dia errado.
   */
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date deve estar no formato AAAA-MM-DD',
  })
  date!: string;

  /** Tamanho do atendimento. Define de quanto em quanto os horários saem. */
  @IsOptional()
  @Type(() => Number)
  @Min(5)
  @Max(480)
  duracaoMinutos?: number;
}
