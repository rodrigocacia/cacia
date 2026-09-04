"use client";

import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/sppiner";

interface EvaluationGaugeChartProps {
  score: number;
}

export function EvaluationGaugeChart({ score }: EvaluationGaugeChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const data = [{ value: score }];

  const getColor = (value: number) => {
    if (value < 3) return "#E36969";
    if (value < 4.5) return "#EBD265";
    return "#73D076";
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="relative flex flex-col items-center justify-center w-full">
        <div className="w-[220px] h-[130px] flex items-center justify-center">
          <Spinner size="sm" className="h-20" />
        </div>
        <div className="absolute left-1/2 top-[55%] -translate-x-1/2 flex flex-col items-center w-full">
          <span className="text-2xl font-extrabold text-[#707070]">
            {score.toFixed(1)}
          </span>
          <span className="text-base font-semibold text-[#BDBDBD] mt-1">
            Sua avaliação está ótima!
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-full">
      <RadialBarChart
        width={220}
        height={120}
        cx={110}
        cy={110}
        innerRadius={100}
        outerRadius={100}
        barSize={20}
        startAngle={180}
        endAngle={0}
        data={data}
      >
        <PolarAngleAxis
          type="number"
          domain={[0, 5]}
          angleAxisId={0}
          tick={false}
        />
        <RadialBar
          background={false}
          dataKey="value"
          cornerRadius={24}
          fill={getColor(score)}
        />
      </RadialBarChart>
      <div className="absolute left-1/2 top-[55%] -translate-x-1/2 flex flex-col items-center w-full">
        <span className="text-2xl font-extrabold text-[#3D3D3D]">
          {score.toFixed(1)}
        </span>
        <span className="text-base font-semibold text-[#BDBDBD] mt-4">
          Sua avaliação está ótima!
        </span>
      </div>
    </div>
  );
}
