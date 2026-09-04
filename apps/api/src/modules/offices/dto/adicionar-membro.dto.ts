import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '@cacia/database';

export class AdicionarMembroDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email!: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Papel inválido' })
  role: Role = Role.USER;
}
