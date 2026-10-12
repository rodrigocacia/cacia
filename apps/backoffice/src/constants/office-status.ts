import { OfficeStatus } from '@/types/office';

/**
 * Situação do escritório: o `status` que a API devolve e aceita, sempre em
 * maiúsculas (PENDING, ACTIVE, DEACTIVATE).
 *
 * O painel lia `signature_status` em minúsculas — campo que a API não tem —
 * e todo escritório aparecia sem situação. Rótulo e cor ficam aqui para que
 * tabela, filtro e detalhe não voltem a divergir. `cor` é o preenchimento
 * suave; `ponto`, a bolinha do selo contornado (StatusChip).
 */
export const SITUACOES_DO_ESCRITORIO: Record<
  OfficeStatus,
  { rotulo: string; cor: string; ponto: string; icon: string }
> = {
  [OfficeStatus.PENDING]: {
    rotulo: 'Pendente',
    cor: 'bg-ambar-fundo text-ambar',
    ponto: 'bg-ambar-ponto',
    icon: 'mdi:clock-outline',
  },
  [OfficeStatus.ACTIVE]: {
    rotulo: 'Ativo',
    cor: 'bg-nevoa text-turquesa-profundo',
    ponto: 'bg-[#4FB3C0]',
    icon: 'mdi:check-circle',
  },
  [OfficeStatus.DEACTIVATE]: {
    rotulo: 'Desativado',
    cor: 'bg-gray-100 text-tinta-3',
    ponto: 'bg-gray-400',
    icon: 'mdi:archive',
  },
};

/** Valor vindo da URL ou da API, reduzido a uma situação conhecida. */
export function situacaoValida(
  valor?: string | null,
): OfficeStatus | undefined {
  const maiusculo = valor?.toUpperCase();

  return Object.values(OfficeStatus).find((s) => s === maiusculo);
}
