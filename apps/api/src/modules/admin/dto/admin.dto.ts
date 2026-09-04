import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { OfficeStatus, Role } from '@cacia/database';
import { PaginacaoDto } from '@/common/dto/paginacao.dto';

export class ListarEscritoriosDto extends PaginacaoDto {
  @IsOptional() @IsEnum(OfficeStatus) status?: OfficeStatus;
}

export class ListarUsuariosDto extends PaginacaoDto {
  @IsOptional() @IsEnum(Role) role?: Role;
}

export class AtualizarUsuarioDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email?: string;

  @IsOptional() @IsString() document?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() birthday?: string;

  /** Concede ou revoga a administração da plataforma. */
  @IsOptional() @IsEnum(Role) role?: Role;
}

export class AtualizarSituacaoDoEscritorioDto {
  @IsEnum(OfficeStatus, { message: 'Situação inválida' })
  status!: OfficeStatus;
}

export class PeriodoDto {
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
}

export class EnderecoDto {
  @IsOptional() @IsString() cep?: string;
  @IsOptional() @IsString() street?: string;
  @IsOptional() @IsString() number?: string;
  @IsOptional() @IsString() complement?: string;
  @IsOptional() @IsString() neighborhood?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
}

/**
 * Cadastro de um escritório novo, com o dono dele.
 *
 * É o trabalho central do backoffice: colocar um escritório no ar. Os dois
 * nascem juntos porque um escritório sem dono é inacessível — nem quem o criou
 * consegue entrar, já que o acesso passa por office_members.
 */
export class CriarEscritorioComDonoDto {
  @IsString() @MinLength(2) name!: string;

  @IsString()
  @Length(14, 14, { message: 'CNPJ deve ter 14 dígitos' })
  @Transform(({ value }: { value: string }) => value?.replace(/\D/g, ''))
  document!: string;

  @IsString() @MinLength(1) oabNumber!: string;
  @IsString() @Length(2, 2) oabUf!: string;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() tradeName?: string;
  @IsOptional() @IsString() remotejid?: string;
  @IsOptional() @IsUUID() planId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnderecoDto)
  addresses?: EnderecoDto[];

  // ---- o dono -------------------------------------------------------------

  @IsString() @MinLength(2) ownerName!: string;

  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  ownerEmail!: string;

  @IsString()
  @MinLength(8, { message: 'Senha precisa de ao menos 8 caracteres' })
  ownerPassword!: string;

  @IsOptional() @IsString() ownerPhone?: string;
}

/** Usuário criado pelo painel, sem escritório vinculado. */
export class CriarUsuarioDto {
  @IsString() @MinLength(2) name!: string;

  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Senha precisa de ao menos 8 caracteres' })
  password!: string;

  @IsOptional() @IsString() document?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() birthday?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
}
