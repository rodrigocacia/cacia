"use client";

import { Bot, ChartColumn, Info } from "lucide-react";

export function navLinks(officeId: string) {
  return [
    {
      id: 1,
      name: "Informações",
      icon: <Info size={16} strokeWidth={1.7} aria-hidden />,
      path: `/office/${officeId}/information`,
    },
    {
      id: 2,
      name: "Performance",
      icon: <ChartColumn size={16} strokeWidth={1.7} aria-hidden />,
      path: `/office/${officeId}/performance`,
    },
    {
      id: 3,
      name: "Consumo de IA",
      icon: <Bot size={16} strokeWidth={1.7} aria-hidden />,
      path: `/office/${officeId}/ai-usage`,
    },
  ];
}
