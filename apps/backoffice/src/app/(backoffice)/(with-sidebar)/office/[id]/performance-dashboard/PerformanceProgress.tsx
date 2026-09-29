import { Icon } from "@/components/icone";

import type { GetOfficePerformanceResponse } from "@/http/office/get-office-performance";
import { processTypeConfig, type ProcessType } from "@/types/process";

interface PerformanceProgressProps {
  data: GetOfficePerformanceResponse;
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeGaugeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  return [
    "M",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

export function PerformanceProgress({ data }: PerformanceProgressProps) {
  const total = data.completed_processes + data.ongoing_processes;

  const hasCompleted = data.completed_processes > 0;
  const hasOngoing = data.ongoing_processes > 0;

  // A API devolve um objeto tipo → quantidade, não uma lista
  const porTipo = Object.entries(data.processes_by_type ?? {});

  let andamentoPercent = 0;
  let concluidoPercent = 0;

  if (total > 0) {
    andamentoPercent = data.ongoing_processes / total;
    concluidoPercent = data.completed_processes / total;
  }

  const cx = 90;
  const cy = 90;
  const r = 80;

  const startAngle = 90;
  const andamentoAngle = startAngle - 180 * andamentoPercent;
  const concluidoAngle = andamentoAngle - 180 * concluidoPercent;

  return (
    <div className="bg-[#FCFCFD] rounded-xl p-4 sm:p-6 mb-8 w-full">
      <h4 className="font-semibold text-[#3D3D3D] mb-4">Andamento geral</h4>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="relative w-[140px] sm:w-[180px] h-[80px] sm:h-[100px] flex items-center justify-center">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 180 100"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <path
                    d={describeGaugeArc(cx, cy, r, 90, -90)}
                    fill="none"
                    stroke="#E6E6E6"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  {hasCompleted && (
                    <path
                      d={describeGaugeArc(
                        cx,
                        cy,
                        r,
                        andamentoAngle,
                        concluidoAngle,
                      )}
                      fill="none"
                      stroke="#73D076"
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                  )}
                  {hasOngoing && (
                    <path
                      d={describeGaugeArc(cx, cy, r, 90, andamentoAngle)}
                      fill="none"
                      stroke="#EDD361"
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                  )}
                </svg>
                <div className="absolute left-1/2 top-[54px] -translate-x-1/2 -translate-y-1/2 text-center w-full pointer-events-none">
                  <span className="text-lg sm:text-xl font-bold text-[#707070] flex items-center justify-center gap-1">
                    <Icon
                      icon="mdi:file-document"
                      className="text-[#BDBDBD]"
                      width={20}
                      height={20}
                    />
                    {data.total_processes}
                  </span>
                  <div className="text-xs text-[#BDBDBD] font-semibold">
                    Processos
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:ml-8 min-w-[160px]">
                <span className="text-xs text-[#BDBDBD] font-semibold mb-1">
                  STATUS
                </span>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-[#6DD07A]"></span>
                  <span className="text-sm text-[#707070] font-medium">
                    Concluídos{" "}
                    <b className="text-[#BDBDBD] font-medium">
                      {data.completed_processes}
                    </b>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-[#FFD600]"></span>
                  <span className="text-sm text-[#707070] font-medium">
                    Em andamento{" "}
                    <b className="text-[#BDBDBD] font-medium">
                      {data.ongoing_processes}
                    </b>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <span className="block text-xs text-[#BDBDBD] font-semibold mb-2">
            TIPO DE PROCESSO
          </span>
          <div className="flex flex-wrap gap-2">
            {porTipo.length === 0 && (
              <span className="text-sm text-[#BDBDBD]">
                Nenhum processo com tipo informado
              </span>
            )}

            {porTipo.map(([tipo, quantidade]) => (
              <span
                key={tipo}
                className="bg-[#ECF7F8] text-[#707070] rounded-sm px-3 sm:px-4 py-1 text-sm font-semibold flex items-center gap-1"
              >
                {processTypeConfig[tipo as ProcessType] ?? tipo}
                <span className="text-[#348C98] font-medium">{quantidade}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
