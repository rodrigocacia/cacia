import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Weekday } from '@cacia/database';

const HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Horário em branco é horário não informado.
 *
 * A tela manda `""` nos dias e turnos desmarcados, e o `@IsOptional` só
 * dispensa `null` e `undefined` — sem isto, qualquer agenda com um dia de
 * folga era recusada com 400.
 */
const semHorarioVazio = ({ value }: { value: unknown }) =>
  value === '' ? undefined : value;

export class DiaDisponivelDto {
  @IsEnum(Weekday) day!: Weekday;

  @IsOptional() @IsBoolean() available?: boolean;

  @IsOptional()
  @Transform(semHorarioVazio)
  @Matches(HORA, { message: 'Horário no formato HH:MM' })
  startTime?: string;

  @IsOptional()
  @Transform(semHorarioVazio)
  @Matches(HORA, { message: 'Horário no formato HH:MM' })
  endTime?: string;

  @IsOptional() @IsBoolean() online?: boolean;
  @IsOptional() @IsBoolean() inPerson?: boolean;

  /** Segundo turno do dia — atendimento de manhã e de tarde com intervalo */
  @IsOptional() @IsBoolean() shift2Available?: boolean;
  @IsOptional()
  @Transform(semHorarioVazio)
  @Matches(HORA, { message: 'Horário no formato HH:MM' })
  shift2StartTime?: string;

  @IsOptional()
  @Transform(semHorarioVazio)
  @Matches(HORA, { message: 'Horário no formato HH:MM' })
  shift2EndTime?: string;
  @IsOptional() @IsBoolean() shift2Online?: boolean;
  @IsOptional() @IsBoolean() shift2InPerson?: boolean;
}

export class CriarAgendaDto {
  @IsString()
  @MinLength(2)
  @Transform(({ value }: { value: string }) => value?.trim())
  title!: string;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() generalRoles?: string;
  @IsOptional() @IsString() generalAvailable?: string;
  @IsOptional() @IsString() cancelRoles?: string;
  @IsOptional() @IsBoolean() notification?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiaDisponivelDto)
  availableDays?: DiaDisponivelDto[];
}

export class AtualizarAgendaDto extends CriarAgendaDto {
  @IsOptional() @IsString() declare title: string;
  @IsOptional() @IsBoolean() status?: boolean;
}
