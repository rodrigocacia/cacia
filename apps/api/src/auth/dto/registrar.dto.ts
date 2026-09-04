import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegistrarDto {
  @IsString()
  @MinLength(2, { message: 'Nome precisa de ao menos 2 caracteres' })
  @Transform(({ value }: { value: string }) => value?.trim())
  name!: string;

  @IsEmail({}, { message: 'E-mail inválido' })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Senha precisa de ao menos 8 caracteres' })
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  document?: string;
}
