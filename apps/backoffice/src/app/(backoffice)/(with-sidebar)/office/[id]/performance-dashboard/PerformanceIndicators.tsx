import { Icon } from "@/components/icone";

import type { GetOfficePerformanceResponse } from "@/http/office/get-office-performance";

interface PerformanceIndicatorsProps {
  data: GetOfficePerformanceResponse;
}

function destaque(variacao: number) {
  return {
    highlight: `${variacao > 0 ? "+" : ""}${variacao}% vs. período anterior`,
    highlightColor: variacao >= 0 ? "text-green-500" : "text-red-500",
  };
}

/**
 * Os indicadores que a API fornece. "Serviços", "avaliação média" e a
 * variação de processos existiam na tela sem existir na resposta, e a tela
 * quebrava ao lê-los.
 */
export function PerformanceIndicators({ data }: PerformanceIndicatorsProps) {
  const indicators = [
    {
      label: "Documentos",
      value: data.documents,
      icon: "mdi:file-document-outline",
      ...destaque(data.documents_variation),
    },
    {
      label: "Leads",
      value: data.leads,
      icon: "mdi:wallet-outline",
      ...destaque(data.leads_variation),
    },
    {
      label: "Clientes",
      value: data.customers,
      icon: "mdi:account-group-outline",
      ...destaque(data.customers_variation),
    },
    {
      label: "Processos",
      value: data.total_processes,
      icon: "mdi:briefcase-outline",
      highlight: "",
      highlightColor: "",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 w-full">
      {indicators.map((item, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl p-5 flex items-center gap-4 min-w-[220px] shadow-sm"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-md bg-[#ECF7F8]">
            <Icon
              icon={item.icon}
              className="text-[#348C98]"
              width={28}
              height={28}
            />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xl font-medium text-[#707070] leading-6">
              {item.value}
            </span>
            <span className="text-sm text-[#BDBDBD] font-medium leading-5">
              {item.label}
            </span>
          </div>
          <div className="flex flex-col items-end min-w-[80px]">
            {item.highlight && (
              <div className="flex items-center gap-1">
                <Icon
                  icon={`mdi:arrow-drop-${item.highlightColor === "text-green-500" ? "up" : "down"}`}
                  className={`${item.highlightColor}`}
                  width={16}
                  height={16}
                />
                <span className={`text-xs font-medium text-[#BDBDBD]`}>
                  {item.highlight}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
