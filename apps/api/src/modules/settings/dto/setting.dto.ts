import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Preferências de notificação do escritório.
 *
 * Todos opcionais: a tela envia só o que mudou, e um PATCH parcial não pode
 * desligar o que não foi tocado.
 */
export class AtualizarConfiguracaoDto {
  @IsOptional() @IsBoolean() notifyClientNewEvent?: boolean;
  @IsOptional() @IsBoolean() notifyClientUpdateProcess?: boolean;

  @IsOptional() @IsBoolean() notifyLawyerNewLead?: boolean;
  @IsOptional() @IsBoolean() notifyLawyerNewCustomer?: boolean;
  @IsOptional() @IsBoolean() notifyLawyerNewMarkLead?: boolean;
  @IsOptional() @IsBoolean() notifyLawyerNewMarkCustomer?: boolean;
  @IsOptional() @IsBoolean() notifyLawyerNewDocument?: boolean;
  @IsOptional() @IsBoolean() notifyLawyerNewEvent?: boolean;
  @IsOptional() @IsBoolean() notifyLawyerUpdateProcess?: boolean;
  @IsOptional() @IsBoolean() notifyLawyerUpdateSystem?: boolean;
}
