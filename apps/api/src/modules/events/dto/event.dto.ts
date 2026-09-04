import {
  ArrayMaxSize,
  IsArray,
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
}

export class AtualizarEventoDto {
  @IsOptional() @IsString() @MinLength(2) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() startTime?: string;
  @IsOptional() @IsDateString() endTime?: string;
  @IsOptional() @IsEnum(EventType) type?: EventType;
  @IsOptional() @IsEnum(EventStatus) status?: EventStatus;
  @IsOptional() @IsEnum(ConsultationMode) consultationMode?: ConsultationMode;
}

export class ListarEventosDto extends PaginacaoDto {
  @IsOptional() @IsEnum(EventStatus) status?: EventStatus;
  @IsOptional() @IsUUID() calendarId?: string;
  @IsOptional() @IsUUID() customerId?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}
