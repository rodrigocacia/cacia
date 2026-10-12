import {
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  CalendarCheck,
  CircleHelp,
  Columns3,
  Gavel,
  Headset,
  Plug,
  Scale,
  Sparkles,
  Tags,
} from "lucide-react"

import type { GrupoDaNav } from "../_ui/nav-secoes"

// As rotas não mudam; só a forma de apresentá-las, agrupadas pelo assunto.
export const GruposDeConfiguracao: GrupoDaNav[] = [
  {
    rotulo: "Escritório",
    itens: [
      {
        nome: "Dados profissionais",
        icone: Briefcase,
        path: "/setting/professional-data",
      },
      { nome: "Agendas", icone: CalendarCheck, path: "/setting/agenda" },
      { nome: "Serviços oferecidos", icone: Scale, path: "/setting/service" },
      {
        nome: "Dúvidas frequentes",
        icone: CircleHelp,
        path: "/setting/question",
      },
    ],
  },
  {
    rotulo: "Assistente",
    itens: [
      { nome: "Atendimento", icone: Headset, path: "/setting/ia-service" },
      { nome: "Assistente pessoal", icone: Bot, path: "/setting/ia-assistent" },
      {
        nome: "Consulta jurídica",
        icone: Gavel,
        path: "/setting/legal-consultation",
      },
      {
        nome: "Conexão WhatsApp",
        icone: Plug,
        path: "/setting/whatsapp-connection",
      },
    ],
  },
  {
    rotulo: "Funil",
    itens: [
      { nome: "Funil de vendas", icone: Columns3, path: "/setting/funil" },
      { nome: "Etiquetas", icone: Tags, path: "/setting/etiquetas" },
      {
        nome: "Assistente no funil",
        icone: Sparkles,
        path: "/setting/ia-funil",
      },
    ],
  },
  {
    rotulo: "Conta",
    itens: [
      { nome: "Notificações", icone: Bell, path: "/setting/notifications" },
      {
        nome: "Consumo do assistente",
        icone: BarChart3,
        path: "/setting/ai-usage",
      },
    ],
  },
]
