import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService, type RespostaAutenticacao } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegistrarDto } from './dto/registrar.dto';
import {
  RedefinirSenhaDto,
  SolicitarCodigoDto,
  ValidarCodigoDto,
} from './dto/recuperar-senha.dto';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  registrar(@Body() dto: RegistrarDto): Promise<RespostaAutenticacao> {
    return this.auth.registrar(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<RespostaAutenticacao> {
    return this.auth.login(dto);
  }

  @Post('forgot')
  @HttpCode(HttpStatus.NO_CONTENT)
  solicitarCodigo(@Body() dto: SolicitarCodigoDto): Promise<void> {
    return this.auth.solicitarCodigo(dto.email);
  }

  @Post('validate-code')
  @HttpCode(HttpStatus.OK)
  validarCodigo(@Body() dto: ValidarCodigoDto): Promise<{ valid: boolean }> {
    return this.auth.validarCodigo(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  redefinirSenha(@Body() dto: RedefinirSenhaDto): Promise<void> {
    return this.auth.redefinirSenha(dto);
  }
}
