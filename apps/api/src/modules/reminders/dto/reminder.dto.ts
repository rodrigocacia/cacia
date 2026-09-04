import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Lembrete avulso, ligado a um compromisso.
 *
 * A criação em lote acontece junto com o evento (`reminderOffsets`). Esta rota
 * existe para o caso em que a pessoa adiciona um aviso depois, numa agenda que
 * já existe.
 */
export class CriarLembreteDto {
  @IsUUID() eventId!: string;

  @IsString() @MinLength(2) title!: string;

  @IsOptional() @IsString() description?: string;

  /** Antecedência em minutos. Zero avisa na hora do compromisso. */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20160, { message: 'Antecedência máxima de 14 dias' })
  timeTrigger!: number;
}

export class ListarLembretesDto {
  /** Lembretes de um compromisso específico. */
  @IsOptional() @IsUUID() eventId?: string;
}

export class ListarPorDataDto {
  @IsOptional() @IsDateString() from?: string;
}
