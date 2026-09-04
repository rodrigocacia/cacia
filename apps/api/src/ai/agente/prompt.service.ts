import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { RedisService } from '@/infra/redis/redis.service';

/**
 * Validade do bloco estático. Serviços, agenda e perguntas frequentes mudam
 * no máximo algumas vezes por semana — 15 minutos de defasagem é aceitável e
 * evita 7 consultas ao banco por mensagem.
 */
const TTL_CACHE_SEGUNDOS = 15 * 60;

export interface DadosDoAgente {
  name: string;
  style: string;
  greeting: string;
}

/**
 * Monta as instruções do agente.
 *
 * O sistema anterior reconstruía um prompt de 1.264 linhas a cada mensagem,
 * disparando 7 consultas ao banco por interação. Quase todo esse conteúdo —
 * serviços, agenda, perguntas frequentes — é estático por escritório e muda no
 * máximo uma vez por semana.
 *
 * Aqui o bloco estático é montado uma vez e guardado em cache. Além de remover
 * as consultas, isso mantém o PREFIXO do prompt idêntico entre mensagens, o que
 * habilita o desconto de cache da própria OpenAI.
 */
@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private chaveCache(officeId: string): string {
    return `prompt:estatico:${officeId}`;
  }

  /**
   * Bloco estático do escritório: identidade, serviços, agenda, perguntas.
   *
   * Vem do cache quando disponível. A falha do Redis não impede a montagem —
   * apenas custa as consultas.
   */
  async blocoEstatico(officeId: string): Promise<string> {
    const chave = this.chaveCache(officeId);

    try {
      const emCache = await this.redis.client.get(chave);
      if (emCache) return emCache;
    } catch {
      // Segue para a montagem: cache indisponível é lentidão, não erro.
    }

    const bloco = await this.montarBlocoEstatico(officeId);

    try {
      await this.redis.client.setex(chave, TTL_CACHE_SEGUNDOS, bloco);
    } catch {
      // Idem: não conseguir gravar o cache não invalida o resultado.
    }

    return bloco;
  }

  /**
   * Invalida o cache do escritório.
   *
   * Chamado quando serviços, agenda ou perguntas mudam — sem isso, a alteração
   * levaria até 15 minutos para aparecer no atendimento.
   */
  async invalidar(officeId: string): Promise<void> {
    await this.redis.client.del(this.chaveCache(officeId)).catch(() => 0);
  }

  private async montarBlocoEstatico(officeId: string): Promise<string> {
    // As consultas vão em paralelo: são independentes entre si, e em série
    // somariam a latência de cada uma.
    const [escritorio, servicos, perguntas, agendas, consulta] =
      await Promise.all([
        this.prisma.office.findUnique({
          where: { id: officeId },
          select: { name: true, tradeName: true, oabUf: true },
        }),
        this.prisma.service.findMany({
          where: { officeId, status: true, deletedAt: null },
          select: {
            title: true,
            description: true,
            area: true,
            valueType: true,
            valueFixed: true,
            valueDetail: true,
          },
          orderBy: { title: 'asc' },
        }),
        this.prisma.question.findMany({
          where: { officeId, status: true, deletedAt: null },
          select: { title: true, description: true },
        }),
        this.prisma.calendar.findMany({
          where: { officeId, status: true, deletedAt: null },
          select: {
            title: true,
            generalAvailable: true,
            availableDays: {
              where: { available: true },
              select: { day: true, startTime: true, endTime: true },
            },
          },
        }),
        this.prisma.consultation.findUnique({
          where: { officeId },
          select: {
            isCharged: true,
            consultationValue: true,
            requiresPaymentToSchedule: true,
          },
        }),
      ]);

    const partes: string[] = [];

    partes.push(
      `Você atende pelo WhatsApp em nome do escritório ${
        escritorio?.tradeName ?? escritorio?.name ?? 'de advocacia'
      }.`,
    );

    if (servicos.length > 0) {
      const lista = servicos
        .map((s) => {
          const valor =
            s.valueType === 'FIXED' && s.valueFixed
              ? `R$ ${s.valueFixed.toString()}`
              : (s.valueDetail ?? 'sob consulta');
          return `- ${s.title} (${valor}): ${s.description}`;
        })
        .join('\n');
      partes.push(`Serviços oferecidos:\n${lista}`);
    }

    if (perguntas.length > 0) {
      const lista = perguntas
        .map((p) => `P: ${p.title}\nR: ${p.description}`)
        .join('\n\n');
      partes.push(`Perguntas frequentes:\n${lista}`);
    }

    if (agendas.length > 0) {
      const lista = agendas
        .map((a) => {
          const dias = a.availableDays
            .map((d) => `${this.nomeDoDia(d.day)} ${d.startTime}-${d.endTime}`)
            .join(', ');
          return `- ${a.title}: ${dias || 'sem horários definidos'}${
            a.generalAvailable ? `\n  ${a.generalAvailable}` : ''
          }`;
        })
        .join('\n');
      partes.push(`Agendas disponíveis:\n${lista}`);
    }

    if (consulta?.isCharged) {
      partes.push(
        `A consulta inicial é cobrada: R$ ${consulta.consultationValue.toString()}.${
          consulta.requiresPaymentToSchedule
            ? ' O pagamento é necessário para confirmar o agendamento.'
            : ''
        }`,
      );
    }

    return partes.join('\n\n');
  }

  /** Instruções de comportamento — dependem do agente, não do escritório. */
  blocoDeComportamento(agente: DadosDoAgente): string {
    return [
      `Seu nome é ${agente.name}. Seu tom é: ${agente.style}.`,
      '',
      'Regras:',
      '- Responda em português do Brasil, de forma direta e humana.',
      '- Mensagens curtas: é WhatsApp, não e-mail.',
      '- Nunca invente informação jurídica, valor ou prazo. Se não souber,',
      '  diga que vai verificar e acione um atendente.',
      '- Nunca prometa resultado de processo.',
      '- Use as ferramentas para consultar dados reais em vez de supor.',
      '- Se a pessoa pedir para falar com uma pessoa, acione o atendente sem',
      '  insistir em resolver sozinha.',
    ].join('\n');
  }

  private nomeDoDia(dia: string): string {
    const nomes: Record<string, string> = {
      MONDAY: 'seg',
      TUESDAY: 'ter',
      WEDNESDAY: 'qua',
      THURSDAY: 'qui',
      FRIDAY: 'sex',
      SATURDAY: 'sáb',
      SUNDAY: 'dom',
    };
    return nomes[dia] ?? dia;
  }
}
