"use client"

import { useSearchParams } from "next/navigation"

import { NavDeSecoes } from "../setting/_ui/nav-secoes"
import { GruposDeNotificacao, navLinks } from "./navs"

export function Sidebar() {
  const searchParams = useSearchParams()

  const type = searchParams.get("type") ?? "all"

  const atual = navLinks.find((link) => link.param === type)?.path ?? ""

  return (
    <NavDeSecoes
      grupos={GruposDeNotificacao}
      rotulo="Tipos de notificação"
      atual={atual}
    />
  )
}
