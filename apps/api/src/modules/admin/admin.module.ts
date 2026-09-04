import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  // AuthModule pelo SenhaService: cadastrar um escritório cria o dono dele
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
