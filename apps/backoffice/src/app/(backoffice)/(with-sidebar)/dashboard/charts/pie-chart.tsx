"use client";

import { PieChart, Pie, Cell } from "recharts";
import { useEffect, useState } from "react";

const COLORS = ["#2C7D88", "#6CC1CC", "#1F5C64", "#D7EBEE"];

interface PieChartProps {
  data: { id: string; name: string; total: number }[];
}

export function CustomPieChart({ data }: PieChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const total = data.reduce((acc, item) => acc + item.total, 0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="flex items-center gap-8 max-sm:flex-col max-sm:items-start">
      <div className="relative flex h-[160px] w-[160px] shrink-0 items-center justify-center">
        {isMounted && (
          <PieChart width={160} height={160}>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={76}
              strokeWidth={2}
              stroke="#FFFFFF"
              label={false}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        )}
        <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1">
          <span className="text-[24px] leading-none font-semibold tracking-[-0.02em] text-tinta tabular">
            {total}
          </span>
          <span className="rotulo">Assinaturas</span>
        </div>
      </div>

      <ul className="flex w-full min-w-0 flex-1 flex-col">
        {data.map((item, index) => (
          <li
            key={item.id}
            className="flex items-center gap-2.5 border-b border-filete py-2.5 text-[13.5px] last:border-b-0"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="flex-grow truncate text-tinta-2">{item.name}</span>
            <span className="font-medium text-tinta tabular">{item.total}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
