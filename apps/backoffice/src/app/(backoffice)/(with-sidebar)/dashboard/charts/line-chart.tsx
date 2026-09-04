"use client";

import {
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area,
} from "recharts";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/sppiner";

interface LineChartProps {
  data: { date: string; total: number }[];
}

export function CustomLineChart({ data }: LineChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const gradientId = "line-gradient";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-[320px] bg-white rounded-2xl p-2 flex items-center justify-center">
        <div className="w-full h-full flex items-center justify-center">
          <Spinner size="sm" className="h-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[320px] bg-white rounded-2xl p-2 flex items-center justify-center">
      <ResponsiveContainer width="98%" height="90%">
        <AreaChart
          data={data}
          margin={{ top: 30, right: 30, left: 0, bottom: 10 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B39DDB" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#fff" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="6 6"
            vertical={false}
            stroke="#F3EFFF"
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 13, fill: "#BDBDBD" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 13, fill: "#BDBDBD" }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#9333EA"
            strokeWidth={3}
            fill="#9333EA54"
            dot={true}
            activeDot={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
