import { IsEmail, IsString, Length, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class SolicitarCodigoDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email!: string;
}

export class ValidarCodigoDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email!: string;

  @IsString()
  @Length(6, 6, { message: 'O código tem 6 dígitos' })
  code!: string;
}

export class RedefinirSenhaDto extends ValidarCodigoDto {
  @IsString()
  @MinLength(8, { message: 'Senha precisa de ao menos 8 caracteres' })
  password!: string;
}
