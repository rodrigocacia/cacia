import { Icon } from "@/components/icone";

/**
 * Chamada de modelo sem preço cadastrado entra com custo zero: o valor
 * mostrado está abaixo do real até o preço ser cadastrado.
 */
export function SeloSemPreco() {
  return (
    <span
      title="Há chamadas de um modelo sem preço cadastrado — o custo delas entrou como zero. Cadastre o preço em Parâmetros de cobrança."
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-[11px] font-semibold whitespace-nowrap"
    >
      <Icon icon="mdi:alert-outline" className="w-3.5 h-3.5" />
      modelo sem preço cadastrado
    </span>
  );
}
