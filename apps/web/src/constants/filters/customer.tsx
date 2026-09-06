import { Icon } from "@/components/icone"

export const customerFilters = [
  { id: "0", name: "Todos", status: "", icon: null },
  {
    id: "1",
    name: "Novos",
    status: "new",
    icon: (
      <Icon
        icon="mdi:folder-clock-outline"
        className="text-[#BDBDBD] w-4 h-4"
      />
    ),
  },
]
