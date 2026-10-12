"use client";

import { KeyRound, UserRound } from "lucide-react";

export const NavLinks = [
  {
    id: 1,
    name: "Meus dados",
    icon: <UserRound size={16} strokeWidth={1.7} aria-hidden />,
    path: "/profile/my-data",
  },
  {
    id: 2,
    name: "Dados de acesso",
    icon: <KeyRound size={16} strokeWidth={1.7} aria-hidden />,
    path: "/profile/password",
  },
];
