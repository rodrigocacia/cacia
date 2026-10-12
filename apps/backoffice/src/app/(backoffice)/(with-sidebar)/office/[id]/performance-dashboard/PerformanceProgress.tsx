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
    <section className="grid w-full rounded-[14px] border border-filete bg-white md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-5 border-filete p-5 sm:p-6 md:border-r max-md:border-b">
        <h3 className="text-[14.5px] font-semibold text-tinta">
          Andamento dos processos
        </h3>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
          <div className="relative h-[100px] w-[180px] shrink-0">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 180 100"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden
            >
              <path
                d={describeGaugeArc(cx, cy, r, 90, -90)}
                fill="none"
                stroke="#ECE8E1"
                strokeWidth="12"
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
                  stroke="#2C7D88"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
              )}
              {hasOngoing && (
                <path
                  d={describeGaugeArc(cx, cy, r, 90, andamentoAngle)}
                  fill="none"
                  stroke="#6CC1CC"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
              )}
            </svg>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center">
              <span className="tabular text-[28px] leading-none font-medium tracking-[-0.03em] text-tinta">
                {data.total_processes}
              </span>
              <span className="mt-1 text-[12px] text-tinta-3">processos</span>
            </div>
          </div>

          <dl className="flex min-w-[180px] flex-1 flex-col">
            <div className="flex items-center gap-2.5 border-b border-[#F1EEE8] py-2.5 text-[13.5px]">
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-[2px] bg-[#2C7D88]"
              />
              <dt className="flex-1 text-tinta-2">Concluídos</dt>
              <dd className="tabular font-semibold text-tinta">
                {data.completed_processes}
              </dd>
            </div>
            <div className="flex items-center gap-2.5 py-2.5 text-[13.5px]">
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-[2px] bg-[#6CC1CC]"
              />
              <dt className="flex-1 text-tinta-2">Em andamento</dt>
              <dd className="tabular font-semibold text-tinta">
                {data.ongoing_processes}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <h3 className="text-[14.5px] font-semibold text-tinta">
          Por tipo de processo
        </h3>

        {porTipo.length === 0 ? (
          <p className="text-[13.5px] text-tinta-3">
            Nenhum processo com tipo informado.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {porTipo.map(([tipo, quantidade]) => (
              <li
                key={tipo}
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-filete bg-papel px-2.5 text-[13px] text-tinta-2"
              >
                {processTypeConfig[tipo as ProcessType] ?? tipo}
                <span className="tabular font-semibold text-tinta">
                  {quantidade}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
