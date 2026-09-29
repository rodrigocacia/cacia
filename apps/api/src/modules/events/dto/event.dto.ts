import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConsultationMode, EventStatus, EventType } from '@cacia/database';
import { PaginacaoDto } from '@/common/dto/paginacao.dto';

export class CriarEventoDto {
  @IsUUID() calendarId!: string;

  @IsString() @MinLength(2) title!: string;

  @IsDateString() startTime!: string;
  @IsDateString() endTime!: string;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(EventType) type?: EventType;
  @IsOptional() @IsEnum(ConsultationMode) consultationMode?: ConsultationMode;

  @IsOptional() @IsUUID() customerId?: string;
  @IsOptional() @IsUUID() leadId?: string;
  @IsOptional() @IsUUID() processId?: string;

  /** Antecedências do lembrete, em minutos antes do início. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(20160, { each: true, message: 'Antecedência máxima de 14 dias' })
  reminderOffsets?: number[];

  /**
   * Marca mesmo havendo outro compromisso no horário.
   *
   * A recusa é o padrão porque dois atendimentos no mesmo horário costumam ser
   * engano. Mas nem toda sobreposição é: um prazo processual e uma reunião
   * podem coincidir de propósito — o que não pode é acontecer sem ninguém ter
   * dito que tudo bem.
   */
  @IsOptional() @IsBoolean() permitirConflito?: boolean;
}

export class AtualizarEventoDto {
  @IsOptional() @IsString() @MinLength(2) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() startTime?: string;
  @IsOptional() @IsDateString() endTime?: string;
  @IsOptional() @IsEnum(EventType) type?: EventType;
  @IsOptional() @IsEnum(EventStatus) status?: EventStatus;
  @IsOptional() @IsEnum(ConsultationMode) consultationMode?: ConsultationMode;

  /**
   * Marca mesmo havendo outro compromisso no horário.
   *
   * A recusa é o padrão porque dois atendimentos no mesmo horário costumam ser
   * engano. Mas nem toda sobreposição é: um prazo processual e uma reunião
   * podem coincidir de propósito — o que não pode é acontecer sem ninguém ter
   * dito que tudo bem.
   */
  @IsOptional() @IsBoolean() permitirConflito?: boolean;
}

export class ListarEventosDto extends PaginacaoDto {
  @IsOptional() @IsEnum(EventStatus) status?: EventStatus;
  @IsOptional() @IsUUID() calendarId?: string;
  @IsOptional() @IsUUID() customerId?: string;

  /** Compromissos de um lead — a aba de atividades dentro da ficha. */
  @IsOptional() @IsUUID() leadId?: string;

  /** Compromissos de um processo — a aba de eventos dentro do processo. */
  @IsOptional() @IsUUID() processId?: string;

  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}
