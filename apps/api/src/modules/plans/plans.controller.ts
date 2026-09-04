import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { SkipTenant } from '@/auth/decorators/skip-tenant.decorator';
import { PlansService } from './plans.service';

/** Catálogo global de planos. Não pertence a escritório. */
@SkipTenant()
@Controller('plans')
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  listar() {
    return this.plans.listar();
  }

  @Get(':id')
  detalhar(@Param('id', ParseUUIDPipe) id: string) {
    return this.plans.detalhar(id);
  }
}
