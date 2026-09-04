import { ProcessStatus } from "@/types/process"
import { Icon } from "@iconify/react/dist/iconify.js"

export const processFilters = [
  { id: "0", name: "Todos", status: "", icon: null },
  {
    id: "1",
    name: ProcessStatus.ACTIVE,
    status: "Ativo",
    icon: (
      <Icon
        icon="mdi:folder-check-outline"
        className="text-[#BDBDBD] w-4 h-4"
      />
    ),
  },
  {
    id: "2",
    name: ProcessStatus.CONCLUDED,
    status: "Concluído",
    icon: (
      <Icon
        icon="mdi:folder-alert-outline"
        className="text-[#BDBDBD] w-4 h-4"
      />
    ),
  },
  {
    id: "3",
    name: ProcessStatus.ARCHIVED,
    status: "Arquivado",
    icon: (
      <Icon
        icon="mdi:folder-clock-outline"
        className="text-[#BDBDBD] w-4 h-4"
      />
    ),
  },
  {
    id: "4",
    name: ProcessStatus.FINISHED,
    status: "Finalizado",
    icon: (
      <Icon
        icon="mdi:check-circle-outline"
        className="text-[#BDBDBD] w-4 h-4"
      />
    ),
  },
]
