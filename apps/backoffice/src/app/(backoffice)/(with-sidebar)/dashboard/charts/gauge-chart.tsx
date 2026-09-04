"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export interface ProcessStatus {
  _id: string;
  total: number;
}

interface CustomGaugeChartProps {
  data: ProcessStatus[];
}

export function CustomGaugeChart({ data }: CustomGaugeChartProps) {
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getChartSize = () => {
    if (windowWidth < 640) return 250;
    if (windowWidth < 1024) return 300;
    return 350;
  };

  const chartSize = getChartSize();

  const totalProcesses = data.reduce((acc, curr) => acc + curr.total, 0);
  const completedProcesses =
    data.find((status) => status._id === "done")?.total || 0;
  const completedPercentage =
    totalProcesses > 0 ? (completedProcesses / totalProcesses) * 100 : 0;

  const strokeWidth = 22;
  const radius = chartSize * 0.35;
  const centerX = chartSize / 2;
  const centerY = chartSize / 2 + 20;

  const describeArc = (startAngle: number, endAngle: number) => {
    const start = (startAngle * Math.PI) / 180;
    const end = (endAngle * Math.PI) / 180;

    const startX = centerX + radius * Math.cos(start);
    const startY = centerY + radius * Math.sin(start);
    const endX = centerX + radius * Math.cos(end);
    const endY = centerY + radius * Math.sin(end);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  };

  const yellowStartAngle = -180;
  const yellowEndAngle = -180 + (completedPercentage / 100) * 180;
  const greenStartAngle = yellowEndAngle;
  const greenEndAngle = 0;

  const yellowPath = describeArc(greenStartAngle, greenEndAngle);
  const greenPath = describeArc(yellowStartAngle, yellowEndAngle);

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="relative"
        style={{ width: chartSize, height: chartSize / 1.5 }}
      >
        <svg
          width={chartSize}
          height={chartSize / 1.5}
          viewBox={`0 0 ${chartSize} ${chartSize / 1.5}`}
        >
          <path
            d={yellowPath}
            fill="none"
            stroke="#EDD361"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path
            d={greenPath}
            fill="none"
            stroke="#73D076"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </svg>

        <div
          className="absolute flex flex-col gap-1.5 items-center justify-center"
          style={{
            top: "65%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%",
          }}
        >
          <div className="flex items-center gap-1">
            <Image
              src="/icons/file-document.svg"
              alt=""
              width={20}
              height={20}
            />

            <div className="text-[#707070] text-xl font-bold">
              {totalProcesses}
            </div>
          </div>

          <div className="text-[#707070] text-base">Processos</div>
        </div>
      </div>
    </div>
  );
}
