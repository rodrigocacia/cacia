"use client"

import Image from "next/image"
import { useState, useEffect } from "react"

import { ProcessStatus } from "@/types/process"

interface TotalPorStatus {
  status: ProcessStatus
  total: number
}

interface CustomGaugeChartProps {
  data?: TotalPorStatus[] | null
}

export function CustomGaugeChart({ data }: CustomGaugeChartProps) {
  const [windowWidth, setWindowWidth] = useState(0)

  useEffect(() => {
    setWindowWidth(window.innerWidth)

    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Calculate chart size based on window width
  const getChartSize = () => {
    if (windowWidth < 640) return 250
    if (windowWidth < 1024) return 300
    return 350
  }

  const chartSize = getChartSize()

  // A fatia verde é a dos processos ativos. Comparava o status com "Ativo",
  // o rótulo em português — a API manda "ACTIVE", e o arco verde ficava sempre
  // em zero.
  const totalProcesses = data?.reduce((acc, curr) => acc + curr.total, 0) || 0
  const activeProcesses =
    data?.find((linha) => linha.status === ProcessStatus.ACTIVE)?.total || 0
  const completedPercentage =
    totalProcesses > 0 ? (activeProcesses / totalProcesses) * 100 : 0

  // SVG parameters - adjusted for better visibility
  const strokeWidth = 22 // Slightly thicker for better visibility
  const radius = chartSize * 0.35 // Slightly smaller radius to fit better
  const centerX = chartSize / 2
  const centerY = chartSize / 2 + 20 // Moved down to center better in the card

  // Calculate the SVG paths for the arcs
  const describeArc = (startAngle: number, endAngle: number) => {
    // Convert angles from degrees to radians
    const start = (startAngle * Math.PI) / 180
    const end = (endAngle * Math.PI) / 180

    // Calculate start and end points
    const startX = centerX + radius * Math.cos(start)
    const startY = centerY + radius * Math.sin(start)
    const endX = centerX + radius * Math.cos(end)
    const endY = centerY + radius * Math.sin(end)

    // Determine if the arc should be drawn the long way around
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"

    // Create the SVG path
    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`
  }

  // Calculate the angles for the yellow and green arcs
  const yellowStartAngle = -180 // Bottom left
  const yellowEndAngle = -180 + (completedPercentage / 100) * 180
  const greenStartAngle = yellowEndAngle
  const greenEndAngle = 0 // Bottom right

  // Create the SVG paths
  const yellowPath = describeArc(greenStartAngle, greenEndAngle)
  const greenPath = describeArc(yellowStartAngle, yellowEndAngle)

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
          {/* Yellow arc (rendered first) */}
          <path
            d={yellowPath}
            fill="none"
            stroke="#EDD361"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Green arc (rendered second to be on top) */}
          <path
            d={greenPath}
            fill="none"
            stroke="#73D076"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </svg>

        {/* Value and label in the center - adjusted position to be lower */}
        <div
          className="absolute flex flex-col gap-1.5 items-center justify-center"
          style={{
            top: "65%", // Moved down from 40% to 60%
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
  )
}
