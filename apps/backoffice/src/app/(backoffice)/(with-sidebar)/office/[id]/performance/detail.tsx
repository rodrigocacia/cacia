/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { getOfficePerformance } from "@/http/office/get-office-performance";
import { PerformanceFilters } from "../performance-dashboard/PerformanceFilters";
import { PerformanceIndicators } from "../performance-dashboard/PerformanceIndicators";
import { PerformanceProgress } from "../performance-dashboard/PerformanceProgress";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Spinner } from "@/components/ui/sppiner";

interface OfficeDetailProps {
  officeId: string;
}

export function OfficeDetail({ officeId }: OfficeDetailProps) {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);

  useEffect(() => {
    async function loadPerformanceData() {
      try {
        const data = await getOfficePerformance({
          officeId,
          periodInDays: selectedPeriod,
        });
        setPerformanceData(data);
      } catch (error) {
        console.error("Erro ao carregar dados de performance:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPerformanceData();
  }, [officeId, selectedPeriod]);

  if (loading) {
    return (
      <div className="w-full bg-white rounded-2xl shadow p-4 mb-8">
        <Spinner size="md" className="h-40" />
      </div>
    );
  }

  return (
    <>
      <div className="w-full bg-white rounded-2xl shadow p-4 mb-8">
        <div className="w-full flex items-center justify-between gap-3 max-md:hidden">
          <div className="flex items-center gap-3">
            <Icon icon="mdi:bar-chart" className="text-[#BDBDBD] w-8 h-8" />

            <h3 className="text-[20px] text-[#707070] font-bold">
              Performance
            </h3>
          </div>
        </div>

        <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200 max-md:hidden" />
        <PerformanceFilters
          onPeriodChange={setSelectedPeriod}
          selectedPeriod={selectedPeriod}
        />
        <PerformanceIndicators data={performanceData} />
        <PerformanceProgress data={performanceData} />
      </div>
    </>
  );
}
