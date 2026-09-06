import { Icon } from "@/components/icone";

interface StatisticProps {
  data: {
    attendances: number;
    leads: number;
    customers: number;
    processes: number;
  };
}

export function Statistic({ data }: StatisticProps) {
  const statistics = [
    {
      id: 0,
      value: data.attendances,
      title: "Atendimentos",
      icon: <Icon icon="mdi:work" className="w-6 h-6 text-[#348C98]" />,
    },
    {
      id: 1,
      value: data.leads,
      title: "Leads",
      icon: <Icon icon="mdi:feedback" className="w-6 h-6 text-[#348C98]" />,
    },
    {
      id: 2,
      value: data.customers,
      title: "Clientes",
      icon: (
        <Icon icon="mdi:account-group" className="w-6 h-6 text-[#348C98]" />
      ),
    },
    {
      id: 3,
      value: data.processes,
      title: "Processos",
      icon: <Icon icon="mdi:folder-text" className="w-6 h-6 text-[#348C98]" />,
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2 mt-9">
        {statistics.map((item) => (
          <div
            key={item.id}
            className="p-3 flex gap-3 max-md:gap-2.5 justify-between bg-white shadow-md rounded-2xl max-md:rounded-[12px]"
          >
            <div className="h-14 w-14 max-md:w-11 max-md:h-11 flex items-center justify-center rounded-2xl max-md:rounded-[12px] bg-[#ECF7F8]">
              {item.icon}
            </div>

            <div className="flex flex-1 flex-col gap-2 max-md:gap-1">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] max-md:text-[18px] font-semibold text-[#707070]">
                  {item.value}
                </h2>

                <p className="text-[10px] max-md:text-[8px]">
                  {item.value} este mês
                </p>
              </div>

              <h3 className="text-sm max-md:text-[12px] text-[#BDBDBD]">
                {item.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
