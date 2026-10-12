import {
  Bell,
  CalendarCheck,
  FileWarning,
  RefreshCw,
  UserPlus,
} from "lucide-react"

import { NotificationType } from "@/types/notification"

import type { GrupoDaNav } from "../setting/_ui/nav-secoes"

export const navLinks = [
  { name: "Todas", param: "all", icone: Bell, path: "/notification" },
  {
    name: "Documentos pendentes",
    param: NotificationType.CONFIRM_DOC,
    icone: FileWarning,
    path: `/notification?type=${NotificationType.CONFIRM_DOC}`,
  },
  {
    name: "Novos compromissos",
    param: NotificationType.NEW_EVENT,
    icone: CalendarCheck,
    path: `/notification?type=${NotificationType.NEW_EVENT}`,
  },
  {
    name: "Atualizações processuais",
    param: NotificationType.PROCESS_UPDATE,
    icone: RefreshCw,
    path: `/notification?type=${NotificationType.PROCESS_UPDATE}`,
  },
  {
    name: "Novos leads",
    param: NotificationType.NEW_LEAD,
    icone: UserPlus,
    path: `/notification?type=${NotificationType.NEW_LEAD}`,
  },
]

export const GruposDeNotificacao: GrupoDaNav[] = [
  {
    rotulo: "Filtrar",
    itens: navLinks.map((link) => ({
      nome: link.name,
      icone: link.icone,
      path: link.path,
    })),
  },
]
