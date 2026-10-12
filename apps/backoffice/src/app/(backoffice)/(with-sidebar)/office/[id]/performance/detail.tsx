"use client";

import { useEffect, useState } from "react";
import {
  getOfficePerformance,
  type GetOfficePerformanceResponse,
} from "@/http/office/get-office-performance";
import { PerformanceFilters } from "../performance-dashboard/PerformanceFilters";
import { PerformanceIndicators } from "../performance-dashboard/PerformanceIndicators";
import { PerformanceProgress } from "../performance-dashboard/PerformanceProgress";
import { Spinner } from "@/components/ui/sppiner";

interface OfficeDetailProps {
  officeId: string;
}

export function OfficeDetail({ officeId }: OfficeDetailProps) {
  const [performanceData, setPerformanceData] =
    useState<GetOfficePerformanceResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);

  useEffect(() => {
    async function loadPerformanceData() {
      try {
        const resultado = await getOfficePerformance({
          officeId,
          periodInDays: selectedPeriod,
        });

        if (resultado.success) {
          setPerformanceData(resultado.data);
          setErro(null);
        } else {
          setErro(resultado.error);
        }
      } catch (error) {
        console.error("Erro ao carregar dados de performance:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPerformanceData();
  }, [officeId, selectedPeriod]);

  return (
    <section className="flex w-full flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-[14.5px] font-semibold text-tinta">
            Performance
          </h2>
          <p className="text-[13px] text-tinta-3">
            Documentos, leads, clientes e processos do escritório no período.
          </p>
        </div>

        <PerformanceFilters
          onPeriodChange={setSelectedPeriod}
          selectedPeriod={selectedPeriod}
        />
      </div>

      {loading ? (
        <div className="rounded-[14px] border border-filete bg-white">
          <Spinner size="md" className="h-40" />
        </div>
      ) : performanceData ? (
        <>
          <PerformanceIndicators data={performanceData} />
          <PerformanceProgress data={performanceData} />
        </>
      ) : (
        <p className="rounded-[14px] border border-filete bg-white px-5 py-10 text-center text-[13.5px] text-tinta-3">
          {erro ?? "Não foi possível carregar o desempenho."}
        </p>
      )}
    </section>
  );
}
