"use client";

import { Building2, UserRound } from "lucide-react";

export function navLinks(userId: string) {
  return [
    {
      id: 1,
      name: "Informações pessoais",
      icon: <UserRound size={16} strokeWidth={1.7} aria-hidden />,
      path: `/user/${userId}/personal-information`,
    },
    {
      id: 2,
      name: "Escritórios",
      icon: <Building2 size={16} strokeWidth={1.7} aria-hidden />,
      path: `/user/${userId}/offices`,
    },
  ];
}
