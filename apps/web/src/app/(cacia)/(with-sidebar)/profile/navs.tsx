import { KeyRound, MapPin, UserRound } from "lucide-react"

import type { GrupoDaNav } from "../setting/_ui/nav-secoes"

export const GruposDaConta: GrupoDaNav[] = [
  {
    rotulo: "Conta",
    itens: [
      { nome: "Meus dados", icone: UserRound, path: "/profile/my-data" },
      { nome: "Endereço", icone: MapPin, path: "/profile/address" },
      { nome: "Dados de acesso", icone: KeyRound, path: "/profile/password" },
    ],
  },
]

/** Descrição de cada seção, para a página de entrada da conta. */
export const DescricoesDaConta: Record<string, string> = {
  "/profile/my-data": "Nome, documento e telefone",
  "/profile/address": "Endereço do escritório",
  "/profile/password": "E-mail de acesso e senha",
}
