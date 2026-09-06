"use client";

import { Icon } from "@/components/icone";

export function navLinks(officeId: string) {
  return [
    {
      id: 1,
      name: "Informações",
      icon: <Icon icon="mdi:user-circle" className="w-5 h-5" />,
      path: `/office/${officeId}/information`,
    },
    {
      id: 2,
      name: "Performance",
      icon: <Icon icon="mdi:chart-box-outline" className="w-5 h-5" />,
      path: `/office/${officeId}/performance`,
    },
  ];
}
