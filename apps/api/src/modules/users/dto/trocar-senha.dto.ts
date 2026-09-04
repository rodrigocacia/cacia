import { IsString, MinLength } from 'class-validator';

export class TrocarSenhaDto {
  @IsString()
  @MinLength(1, { message: 'Informe a senha atual' })
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: 'A nova senha precisa de ao menos 8 caracteres' })
  newPassword!: string;
}
