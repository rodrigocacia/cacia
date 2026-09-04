import { Icon } from "@iconify/react";

interface PerformanceData {
  data: {
    services: number;
    servicesVariation: number;
    customers: number;
    customersVariation: number;
    documents: number;
    documentsVariation: number;
    leads: number;
    leadsVariation: number;
    feedbackAverage: number;
    feedbackQuantity: number;
    proccesses: number;
    proccessesVariation: number;
    processesByType: Record<string, number>;
  };
}

interface PerformanceIndicatorsProps {
  data: PerformanceData;
}

export function PerformanceIndicators({ data }: PerformanceIndicatorsProps) {
  const indicators = [
    {
      label: "Documentos",
      value: data.data.documents,
      icon: "mdi:file-document-outline",
      highlight: `${data.data.documentsVariation > 0 ? "+" : ""}${data.data.documentsVariation}% este mês`,
      highlightColor:
        data.data.documentsVariation >= 0 ? "text-green-500" : "text-red-500",
    },
    {
      label: "Leads",
      value: data.data.leads,
      icon: "mdi:wallet-outline",
      highlight: `${data.data.leadsVariation > 0 ? "+" : ""}${data.data.leadsVariation}% este mês`,
      highlightColor:
        data.data.leadsVariation >= 0 ? "text-green-500" : "text-red-500",
    },
    {
      label: "Clientes",
      value: data.data.customers,
      icon: "mdi:account-group-outline",
      highlight: `${data.data.customersVariation > 0 ? "+" : ""}${data.data.customersVariation}% este mês`,
      highlightColor:
        data.data.customersVariation >= 0 ? "text-green-500" : "text-red-500",
    },
    {
      label: "Processos",
      value: data.data.proccesses,
      icon: "mdi:briefcase-outline",
      highlight: `${data.data.proccessesVariation > 0 ? "+" : ""}${data.data.proccessesVariation}% este mês`,
      highlightColor:
        data.data.proccessesVariation >= 0 ? "text-green-500" : "text-red-500",
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
