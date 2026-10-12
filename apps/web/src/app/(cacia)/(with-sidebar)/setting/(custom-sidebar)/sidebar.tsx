"use client"

import { NavDeSecoes } from "../_ui/nav-secoes"
import { GruposDeConfiguracao } from "./navs"

export function Sidebar() {
  return (
    <NavDeSecoes
      grupos={GruposDeConfiguracao}
      rotulo="Seções das configurações"
    />
  )
}
