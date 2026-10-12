export interface Indicador {
  rotulo: string;
  /** `null` quando o número não existe — a célula mostra "—". */
  valor: string | null;
  /** Linha pequena embaixo do número. */
  nota?: string;
}

/**
 * Faixa de indicadores: um cartão só, células separadas por filetes — o
 * mesmo desenho do Início do app do escritório.
 */
export function FaixaDeIndicadores({ itens }: { itens: Indicador[] }) {
  return (
    <div className="grid grid-cols-4 gap-px overflow-hidden rounded-[14px] border border-filete bg-filete max-lg:grid-cols-2">
      {itens.map((item) => (
        <div
          key={item.rotulo}
          className="flex flex-col gap-2 bg-white px-5 py-[18px]"
        >
          <span className="rotulo">{item.rotulo}</span>
          <span
            className={`text-[30px] leading-none font-semibold tracking-[-0.02em] tabular max-md:text-[26px] ${
              item.valor === null ? "text-gray-400" : "text-tinta"
            }`}
          >
            {item.valor ?? "—"}
          </span>
          {item.nota && (
            <span className="text-[12.5px] text-tinta-3">{item.nota}</span>
          )}
        </div>
      ))}
    </div>
  );
}
