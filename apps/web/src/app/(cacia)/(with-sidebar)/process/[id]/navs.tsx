import { Icon } from "@iconify/react/dist/iconify.js"

export function navLinks(processId: string) {
  return [
    {
      id: 1,
      name: "Informações",
      icon: <Icon icon="mdi:format-list-bulleted" className="w-5 h-5" />,
      path: `/process/${processId}/information`,
    },
    {
      id: 2,
      name: "Andamentos",
      icon: <Icon icon="mdi:folder-file-outline" className="w-5 h-5" />,
      path: `/process/${processId}/progress`,
    },
    {
      id: 3,
      name: "Eventos",
      icon: <Icon icon="mdi:calendar-month-outline" className="w-5 h-5" />,
      path: `/process/${processId}/events`,
    },
    {
      id: 4,
      name: "Documentos",
      icon: <Icon icon="mdi:file-document-outline" className="w-5 h-5" />,
      path: `/process/${processId}/document`,
    },
  ]
}
