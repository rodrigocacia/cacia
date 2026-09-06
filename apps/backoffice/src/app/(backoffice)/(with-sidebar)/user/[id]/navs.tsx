"use client";

import { Icon } from "@/components/icone";

export function navLinks(userId: string) {
  return [
    {
      id: 1,
      name: "Informações pessoais",
      icon: <Icon icon="mdi:user-circle" className="w-5 h-5" />,
      path: `/user/${userId}/personal-information`,
    },
    {
      id: 2,
      name: "Escritórios",
      icon: <Icon icon="mdi:office-building" className="w-5 h-5" />,
      path: `/user/${userId}/offices`,
    },
  ];
}
