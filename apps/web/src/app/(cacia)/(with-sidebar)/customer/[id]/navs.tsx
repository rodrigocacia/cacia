"use client"

import { Icon } from "@iconify/react/dist/iconify.js"

export function navLinks(customerId: string) {
  return [
    {
      id: 1,
      name: "Informações pessoais",
      icon: <Icon icon="mdi:user-circle" className="w-5 h-5" />,
      path: `/customer/${customerId}/personal-information`,
    },
    {
      id: 2,
      name: "Processos",
      icon: <Icon icon="mdi:folder-text-outline" className="w-5 h-5" />,
      path: `/customer/${customerId}/process`,
    },
    {
      id: 3,
      name: "Documentos",
      icon: <Icon icon="mdi:file-document-outline" className="w-5 h-5" />,
      path: `/customer/${customerId}/document`,
    },
    {
      id: 4,
      name: "Eventos",
      icon: <Icon icon="mdi:calendar-month-outline" className="w-5 h-5" />,
      path: `/customer/${customerId}/events`,
    },
  ]
}
