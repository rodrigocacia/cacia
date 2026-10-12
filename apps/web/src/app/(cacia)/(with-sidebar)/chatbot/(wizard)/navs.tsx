import { ShieldCheck, User } from "lucide-react"

import type { GrupoDaNav } from "../../setting/_ui/nav-secoes"

/** Seções da área de chatbot: avisos para clientes e para administradores. */
export const GruposDoChatbot: GrupoDaNav[] = [
  {
    rotulo: "Avisos",
    itens: [
      { nome: "Cliente", path: "/chatbot/client", icone: User },
      {
        nome: "Administrador",
        path: "/chatbot/administrator",
        icone: ShieldCheck,
      },
    ],
  },
]
