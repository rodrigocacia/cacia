import { Icon } from "@/components/icone"

export const leadFilters = [
  { id: "0", name: "Todos", status: "", icon: null },
  {
    id: "1",
    name: "Novos",
    status: "NEW",
    icon: (
      <Icon
        icon="mdi:folder-clock-outline"
        className="text-[#BDBDBD] w-4 h-4"
      />
    ),
  },
  {
    id: "2",
    name: "Em contato",
    status: "IN_CONTACT",
    icon: <Icon icon="mdi:message-fast" className="text-[#BDBDBD] w-4 h-4" />,
  },
  {
    id: "3",
    name: "Convertidos",
    status: "CONVERTED",
    icon: (
      <Icon
        icon="mdi:account-check-outline"
        className="text-[#BDBDBD] w-4 h-4"
      />
    ),
  },
]
