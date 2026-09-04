import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SenhaService } from './senha.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // O tipo do jsonwebtoken e uma uniao de literais; o valor vem
          // validado pelo schema de ambiente.
          expiresIn: config.getOrThrow<string>(
            'JWT_EXPIRATION_TIME',
          ) as `${number}d`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SenhaService, JwtStrategy],
  exports: [JwtModule, SenhaService],
})
export class AuthModule {}
