"use client"

import { Bot, MessagesSquare } from "lucide-react"

import { NavDeSecoes } from "../../setting/_ui/nav-secoes"

export function Sidebar() {
  return (
    <NavDeSecoes
      rotulo="Seções do assistente"
      grupos={[
        {
          rotulo: "Assistente",
          itens: [
            {
              nome: "Atendimento",
              path: "/chatbot/service",
              icone: MessagesSquare,
            },
            { nome: "Personalização", path: "/chatbot/assistant", icone: Bot },
          ],
        },
      ]}
    />
  )
}
