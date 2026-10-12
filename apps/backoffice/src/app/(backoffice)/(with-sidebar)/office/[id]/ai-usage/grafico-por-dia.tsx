"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Spinner } from "@/components/ui/sppiner";
import { formatarData, formatarReais } from "@/utils/consumo-ia";

interface Dia {
  dia: string;
  custo: number;
  cobrado: number;
}

/** Marcas do eixo: Geist Mono 11 px, no tom apagado da paleta. */
const EIXO = {
  fontSize: 11,
  fill: "#756E65",
  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
};

const valorCurto = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});

function DicaDoDia({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Dia }[];
}) {
  if (!active || !payload?.length) return null;

  const dia = payload[0].payload;

  return (
    <div className="flex flex-col gap-1 rounded-[10px] border border-filete bg-white px-3 py-2.5 text-[12.5px] text-tinta-2 shadow-[0_8px_24px_rgba(21,19,17,0.08)]">
      <span className="font-mono text-[11px] text-tinta-3 tabular">
        {formatarData(dia.dia)}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-[2px] bg-acao" aria-hidden />
        Valor a cobrar:{" "}
        <strong className="tabular font-semibold text-tinta">
          {formatarReais(dia.cobrado)}
        </strong>
      </span>
      <span className="pl-3.5 tabular">Custo: {formatarReais(dia.custo)}</span>
    </div>
  );
}

/**
 * Valor a cobrar por dia — uma série só; o custo aparece na dica ao passar o
 * mouse. Duas barras por dia num mês de 31 dias ficariam finas demais para
 * comparar, e a diferença entre as duas é só a margem, constante.
 */
export function GraficoPorDia({ dias }: { dias: Dia[] }) {
  // O ResponsiveContainer mede o DOM: renderizado no servidor, nasce com
  // largura zero e o gráfico pisca ao hidratar
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  if (!montado) return <Spinner size="sm" className="h-[280px]" />;

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={dias}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
            stroke="#ECE8E1"
          />
          <XAxis
            dataKey="dia"
            tickFormatter={(dia: string) => dia.slice(8, 10)}
            tick={EIXO}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={8}
          />
          <YAxis
            tickFormatter={(valor: number) => valorCurto.format(valor)}
            tick={EIXO}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<DicaDoDia />} cursor={{ fill: "#EEF6F7" }} />
          <Bar
            dataKey="cobrado"
            name="Valor a cobrar"
            fill="#2C7D88"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
