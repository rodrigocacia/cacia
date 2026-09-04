const avaliacoesDistribuicao = [
  { estrelas: 1, qtd: 2 },
  { estrelas: 2, qtd: 5 },
  { estrelas: 3, qtd: 15 },
  { estrelas: 4, qtd: 83 },
  { estrelas: 5, qtd: 142 },
];
const totalAtendimentos = 247;

export function PerformanceRatings() {
  return (
    <div className="bg-[#FCFCFD] rounded-xl p-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-3 w-full md:w-2/3">
          {avaliacoesDistribuicao.map((item) => {
            const percent = (item.qtd / totalAtendimentos) * 100;
            return (
              <div key={item.estrelas} className="flex items-center gap-2">
                <span className="text-xs font-semibold w-20 text-[#707070]">
                  {item.qtd} avaliações
                </span>
                <div className="flex-1 relative h-7 bg-[#E6E6E6] rounded-full overflow-hidden flex items-center">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-[#4D8EFF] flex items-center transition-all duration-300"
                    style={{ width: `${percent}%`, zIndex: 1 }}
                  >
                    <span
                      className="flex items-center gap-1 pl-3 pr-4 py-0.5 text-xs font-bold text-white"
                      style={{ minWidth: 48 }}
                    >
                      <span className="text-base">★</span>
                      {item.estrelas}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col items-center justify-center w-full md:w-1/3">
          <span className="text-2xl font-bold flex items-center gap-2 text-[#BDBDBD]">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path
                d="M19 7V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1"
                stroke="#BDBDBD"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17 9l4-4m0 0l-4-4m4 4H9"
                stroke="#BDBDBD"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {totalAtendimentos}
          </span>
          <span className="text-xs text-[#BDBDBD] font-semibold">
            Atendimentos
          </span>
        </div>
      </div>
    </div>
  );
}
