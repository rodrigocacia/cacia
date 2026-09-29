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
    <div className="bg-white rounded-lg shadow-md px-3 py-2 text-xs text-[#707070] flex flex-col gap-0.5">
      <span className="font-semibold text-[#3D3D3D]">
        {formatarData(dia.dia)}
      </span>
      <span>Valor a cobrar: {formatarReais(dia.cobrado)}</span>
      <span>Custo: {formatarReais(dia.custo)}</span>
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
            stroke="#F0F0F0"
          />
          <XAxis
            dataKey="dia"
            tickFormatter={(dia: string) => dia.slice(8, 10)}
            tick={{ fontSize: 12, fill: "#BDBDBD" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={8}
          />
          <YAxis
            tickFormatter={(valor: number) => valorCurto.format(valor)}
            tick={{ fontSize: 12, fill: "#BDBDBD" }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<DicaDoDia />} cursor={{ fill: "#ECF7F8" }} />
          <Bar
            dataKey="cobrado"
            name="Valor a cobrar"
            fill="#348C98"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
