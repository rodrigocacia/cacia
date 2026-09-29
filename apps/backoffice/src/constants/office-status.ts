import { OfficeStatus } from '@/types/office';

/**
 * Situação do escritório: o `status` que a API devolve e aceita, sempre em
 * maiúsculas (PENDING, ACTIVE, DEACTIVATE).
 *
 * O painel lia `signature_status` em minúsculas — campo que a API não tem —
 * e todo escritório aparecia sem situação. Rótulo e cor ficam aqui para que
 * tabela, filtro e detalhe não voltem a divergir.
 */
export const SITUACOES_DO_ESCRITORIO: Record<
  OfficeStatus,
  { rotulo: string; cor: string; icon: string }
> = {
  [OfficeStatus.PENDING]: {
    rotulo: 'Pendente',
    cor: 'bg-[#FEF7D7] text-[#F7CB08]',
    icon: 'mdi:clock-outline',
  },
  [OfficeStatus.ACTIVE]: {
    rotulo: 'Ativo',
    cor: 'bg-[#EDFDEE] text-[#16A31B]',
    icon: 'mdi:check-circle',
  },
  [OfficeStatus.DEACTIVATE]: {
    rotulo: 'Desativado',
    cor: 'bg-[#FEF2F2] text-[#DC2626]',
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
