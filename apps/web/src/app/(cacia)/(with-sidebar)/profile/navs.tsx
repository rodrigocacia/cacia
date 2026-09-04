"use client"

import { Icon } from "@iconify/react/dist/iconify.js"

export const NavLinks = [
  {
    id: 1,
    name: "Meus dados",
    icon: <Icon icon="mdi:user-circle" className="w-5 h-5" />,
    path: "/profile/my-data",
  },
  {
    id: 2,
    name: "Endereço",
    icon: <Icon icon="mdi:address-marker-outline" className="w-5 h-5" />,
    path: "/profile/address",
  },
  {
    id: 3,
    name: "Dados de acesso",
    icon: <Icon icon="mdi:password-outline" className="w-5 h-5" />,
    path: "/profile/password",
  },
]
