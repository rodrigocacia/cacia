import { BadRequestException } from '@nestjs/common';

/**
 * Brasília não tem horário de verão desde 2019: o deslocamento é fixo. Um
 * relatório "do dia 1º" precisa começar à meia-noite daqui, não à de Londres,
 * ou o consumo das 21h às 24h do último dia cairia no mês seguinte.
 */
const DESLOCAMENTO = '-03:00';
const MAX_DIAS = 366;
const DIA_MS = 24 * 60 * 60 * 1000;

export interface Periodo {
  de: string;
  ate: string;
  /** Meia-noite de `de` em Brasília, em UTC. */
  inicio: Date;
  /** Meia-noite do dia seguinte a `ate`, em UTC (exclusivo). */
  fim: Date;
  dias: string[];
}

function hojeEmBrasilia(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function inicioDoDia(dia: string): Date {
  const data = new Date(`${dia}T00:00:00${DESLOCAMENTO}`);
  if (Number.isNaN(data.getTime())) {
    throw new BadRequestException(`Data inválida: ${dia}`);
  }
  return data;
}

function diaDe(data: Date): string {
  return new Date(data.getTime() - 3 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

/**
 * Período do relatório. Sem datas, é o mês corrente até hoje, o recorte da
 * cobrança mensal.
 */
export function montarPeriodo(de?: string, ate?: string): Periodo {
  const hoje = hojeEmBrasilia();
  const fimDoPeriodo = ate ?? hoje;
  const inicioDoPeriodo = de ?? `${fimDoPeriodo.slice(0, 8)}01`;

  const inicio = inicioDoDia(inicioDoPeriodo);
  const fim = new Date(inicioDoDia(fimDoPeriodo).getTime() + DIA_MS);

  if (fim <= inicio) {
    throw new BadRequestException('A data final precisa ser depois da inicial');
  }

  const total = Math.round((fim.getTime() - inicio.getTime()) / DIA_MS);

  if (total > MAX_DIAS) {
    throw new BadRequestException('O período pode ter no máximo um ano');
  }

  const dias = Array.from({ length: total }, (_, i) =>
    diaDe(new Date(inicio.getTime() + i * DIA_MS)),
  );

  return { de: inicioDoPeriodo, ate: fimDoPeriodo, inicio, fim, dias };
}

/**
 * O período de mesmo tamanho imediatamente antes: a comparação justa. Mês
 * corrente até o dia 10 contra o mês anterior inteiro sempre pareceria queda.
 */
export function periodoAnterior(periodo: Periodo): Periodo {
  const duracao = periodo.fim.getTime() - periodo.inicio.getTime();
  const fim = periodo.inicio;
  const inicio = new Date(fim.getTime() - duracao);

  return montarPeriodo(diaDe(inicio), diaDe(new Date(fim.getTime() - DIA_MS)));
}
