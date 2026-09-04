"use client";

import { PieChart, Pie, Cell } from "recharts";
import { useEffect, useState } from "react";

const COLORS = ["#CFECFC", "#71C5F5", "#0C77B6", "#063856"];

interface PieChartProps {
  data: { id: string; name: string; total: number }[];
}

export function CustomPieChart({ data }: PieChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const total = data.reduce((acc, item) => acc + item.total, 0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex flex-row items-center justify-start gap-10 bg-white rounded-2xl p-6">
        <div className="relative flex items-center justify-center w-[160px] h-[160px]">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <span className="text-xl font-extrabold text-[#707070]">
              {total}
            </span>
            <span className="text-sm text-[#BDBDBD] font-semibold -mt-1">
              Assinaturas
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 ml-2">
          {data.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: COLORS[index % COLORS.length],
                  display: "inline-block",
                }}
              />
              <span className="text-[#707070] text-sm font-semibold mr-1">
                {item.name}:
              </span>
              <span className="text-[#BDBDBD] text-sm font-semibold">
                {item.total}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-start gap-10 xl:gap-1 bg-white rounded-2xl">
      <div className="relative flex items-center justify-center xl:w-[120px] xl:h-[120px]">
        <PieChart width={180} height={180}>
          <Pie
            data={data}
            dataKey="total"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={80}
            strokeWidth={0}
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
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <span className="text-xl font-extrabold text-[#707070]">{total}</span>
          <span className="text-sm xl:hidden text-[#BDBDBD] font-semibold -mt-1">
            Assinaturas
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2 ml-2">
        {data.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: COLORS[index % COLORS.length],
                display: "inline-block",
              }}
            />
            <span className="text-[#3D3D3D] text-sm font-semibold mr-1">
              {item.name}:
            </span>
            <span className="text-[#BDBDBD] text-sm font-semibold">
              {item.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
