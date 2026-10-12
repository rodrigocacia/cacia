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

const EIXO = {
  fontSize: 11,
  fill: "#756E65",
  fontFamily: "var(--font-geist-mono)",
};

export function CustomLineChart({ data }: LineChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const gradientId = "line-gradient";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mt-4 h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2C7D88" stopOpacity={0.14} />
              <stop offset="100%" stopColor="#2C7D88" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#ECE8E1" />
          <XAxis dataKey="date" tick={EIXO} axisLine={false} tickLine={false} />
          <YAxis
            tick={EIXO}
            axisLine={false}
            tickLine={false}
            width={32}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: "#DDD7CE" }}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #ECE8E1",
              fontSize: 12.5,
              boxShadow: "0 12px 32px rgba(21,19,17,0.12)",
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            name="Assinaturas"
            stroke="#2C7D88"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: "#2C7D88", stroke: "#FFFFFF" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
