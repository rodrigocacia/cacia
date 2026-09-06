import { ProcessStatus, processStatusConfig } from "@/types/process"
import { Icon } from "@/components/icone"

/**
 * `name` é o que aparece na tela; `status` é o que vai na query para a API.
 * Eram os dois em português, e a API respondia 400 a qualquer filtro de status
 * escolhido — o rótulo agora sai de processStatusConfig, que é onde ele mora.
 */
export const processFilters = [
  { id: "0", name: "Todos", status: "", icon: null },
  {
    id: "1",
    name: processStatusConfig[ProcessStatus.ACTIVE].label,
    status: ProcessStatus.ACTIVE,
    icon: (
      <Icon
        icon="mdi:folder-check-outline"
        className="text-[#BDBDBD] w-4 h-4"
      />
    ),
  },
  {
    id: "2",
    name: processStatusConfig[ProcessStatus.CONCLUDED].label,
    status: ProcessStatus.CONCLUDED,
    icon: (
      <Icon
        icon="mdi:folder-alert-outline"
        className="text-[#BDBDBD] w-4 h-4"
      />
    ),
  },
  {
    id: "3",
    name: processStatusConfig[ProcessStatus.ARCHIVED].label,
    status: ProcessStatus.ARCHIVED,
    icon: (
      <Icon
        icon="mdi:folder-clock-outline"
        className="text-[#BDBDBD] w-4 h-4"
      />
    ),
  },
  {
    id: "4",
    name: processStatusConfig[ProcessStatus.FINISHED].label,
    status: ProcessStatus.FINISHED,
    icon: (
      <Icon
        icon="mdi:check-circle-outline"
        className="text-[#BDBDBD] w-4 h-4"
      />
    ),
  },
]
