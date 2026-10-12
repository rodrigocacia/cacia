"use client"

import { NavDeSecoes } from "../../setting/_ui/nav-secoes"
import { GruposDoChatbot } from "./navs"

export function Sidebar() {
  return <NavDeSecoes grupos={GruposDoChatbot} rotulo="Seções do chatbot" />
}
