import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { RedisService } from '@/infra/redis/redis.service';
import { Public } from '@/auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Responde se o processo está vivo. Não toca em dependências. */
  @Public()
  @Get()
  vivo(): { status: string } {
    return { status: 'ok' };
  }

  /**
   * Responde se o processo consegue atender requisições de verdade.
   * O Fly usa isto para decidir se envia tráfego para a máquina.
   */
  @Public()
  @Get('ready')
  async pronto(): Promise<{
    status: string;
    dependencias: Record<string, string>;
  }> {
    const [postgres, redis] = await Promise.all([
      this.prisma.$queryRaw`SELECT 1`.then(() => 'ok').catch(() => 'falha'),
      this.redis.client
        .ping()
        .then(() => 'ok')
        .catch(() => 'falha'),
    ]);

    const tudoOk = postgres === 'ok' && redis === 'ok';

    return {
      status: tudoOk ? 'ok' : 'degradado',
      dependencias: { postgres, redis },
    };
  }
}
