"use client"

import { NavDeSecoes } from "../setting/_ui/nav-secoes"
import { GruposDaConta } from "./navs"

export function Sidebar() {
  return <NavDeSecoes grupos={GruposDaConta} rotulo="Seções da conta" />
}
