import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import type { GetOfficePerformanceResponse } from "@/http/office/get-office-performance";

interface PerformanceIndicatorsProps {
  data: GetOfficePerformanceResponse;
}

function destaque(variacao: number) {
  return {
    highlight: `${variacao > 0 ? "+" : ""}${variacao}%`,
    variacao,
  };
}

/**
 * Os indicadores que a API fornece. "Serviços", "avaliação média" e a
 * variação de processos existiam na tela sem existir na resposta, e a tela
 * quebrava ao lê-los.
 *
 * Uma faixa única dividida por filetes, como os números do Início do app.
 */
export function PerformanceIndicators({ data }: PerformanceIndicatorsProps) {
  const indicators: {
    label: string;
    value: number;
    highlight: string;
    variacao: number | null;
  }[] = [
    {
      label: "Documentos",
      value: data.documents,
      ...destaque(data.documents_variation),
    },
    {
      label: "Leads",
      value: data.leads,
      ...destaque(data.leads_variation),
    },
    {
      label: "Clientes",
      value: data.customers,
      ...destaque(data.customers_variation),
    },
    {
      label: "Processos",
      value: data.total_processes,
      highlight: "",
      variacao: null,
    },
  ];

  return (
    <section
      aria-label="Números do período"
      className="grid w-full grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-filete bg-filete lg:grid-cols-4"
    >
      {indicators.map((item) => {
        const Seta = (item.variacao ?? 0) < 0 ? ArrowDownRight : ArrowUpRight;

        return (
          <div
            key={item.label}
            className="flex min-w-0 flex-col gap-2 bg-white px-5 py-5 max-sm:px-4"
          >
            <span className="text-[12.5px] text-tinta-3">{item.label}</span>

            <span className="tabular text-[30px] leading-none font-medium tracking-[-0.03em] text-tinta max-sm:text-[26px]">
              {item.value}
            </span>

            {item.variacao === null ? (
              <span className="text-[12px] text-tinta-3">no total</span>
            ) : (
              <span className="flex flex-wrap items-center gap-x-1 text-[12px] text-tinta-3">
                <span
                  className={`tabular inline-flex items-center gap-0.5 font-semibold ${
                    item.variacao > 0
                      ? "text-turquesa-profundo"
                      : item.variacao < 0
                        ? "text-[#A23B2A]"
                        : "text-tinta-2"
                  }`}
                >
                  {item.variacao !== 0 && (
                    <Seta size={13} strokeWidth={2} aria-hidden />
                  )}
                  {item.highlight}
                </span>
                vs. período anterior
              </span>
            )}
          </div>
        );
      })}
    </section>
  );
}
