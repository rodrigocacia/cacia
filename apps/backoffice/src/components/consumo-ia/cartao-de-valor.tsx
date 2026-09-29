import { ReactNode } from "react";

import { Icon } from "@/components/icone";

interface CartaoDeValorProps {
  icon: string;
  rotulo: string;
  valor: string;
  /** Linha de apoio abaixo do rótulo (variação, valor secundário). */
  detalhe?: ReactNode;
}

/** Indicador do relatório de consumo, no mesmo desenho dos de Performance. */
export function CartaoDeValor({
  icon,
  rotulo,
  valor,
  detalhe,
}: CartaoDeValorProps) {
  return (
    <div className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-sm min-w-0">
      <div className="flex items-center justify-center w-12 h-12 shrink-0 rounded-md bg-[#ECF7F8]">
        <Icon icon={icon} className="text-[#348C98]" width={28} height={28} />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-xl font-semibold text-[#3D3D3D] leading-7 truncate">
          {valor}
        </span>
        <span className="text-sm text-[#707070] font-medium leading-5">
          {rotulo}
        </span>
        {detalhe && (
          <span className="text-xs text-[#BDBDBD] font-medium mt-0.5">
            {detalhe}
          </span>
        )}
      </div>
    </div>
  );
}
