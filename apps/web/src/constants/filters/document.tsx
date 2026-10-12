import { Icon } from "@/components/icone"

export const documentSortOptions = [
  {
    id: "1",
    name: "Nome A-Z",
    value: "name_asc",
    icon: (
      <Icon
        icon="mdi:sort-alphabetical-ascending"
        className="text-[#A39C93] w-4 h-4"
      />
    ),
  },
  {
    id: "2",
    name: "Nome Z-A",
    value: "name_desc",
    icon: (
      <Icon
        icon="mdi:sort-alphabetical-descending"
        className="text-[#A39C93] w-4 h-4"
      />
    ),
  },
  {
    id: "3",
    name: "Mais recentes",
    value: "newest",
    icon: (
      <Icon
        icon="mdi:clock-time-eight-outline"
        className="text-[#A39C93] w-4 h-4"
      />
    ),
  },
  {
    id: "4",
    name: "Mais antigos",
    value: "oldest",
    icon: (
      <Icon
        icon="mdi:clock-time-eight-outline"
        className="text-[#A39C93] w-4 h-4"
      />
    ),
  },
]
