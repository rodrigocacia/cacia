import { StatusChip } from "@/components/ui/status-chip";

/**
 * Chamada de modelo sem preço cadastrado entra com custo zero: o valor
 * mostrado está abaixo do real até o preço ser cadastrado.
 */
export function SeloSemPreco() {
  return (
    <span title="Há chamadas de um modelo sem preço cadastrado — o custo delas entrou como zero. Cadastre o preço em Parâmetros de cobrança.">
      <StatusChip ponto="bg-ambar-ponto">modelo sem preço</StatusChip>
    </span>
  );
}
