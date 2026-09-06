import { Icon } from "@/components/icone"
import { BiCalendarCheck } from "react-icons/bi"

export const NavLinks = [
  {
    id: 1,
    name: "Dados profissionais",
    icon: <Icon icon="mdi:work-outline" className="w-5 h-5" />,
    path: "/setting/professional-data",
  },
  {
    id: 2,
    name: "Agendas",
    icon: <BiCalendarCheck className="w-5 h-5" />,
    path: "/setting/agenda",
  },
  {
    id: 3,
    name: "I.A. Atendimento",
    icon: <Icon icon="mdi:assistant" className="w-5 h-5" />,
    path: "/setting/ia-service",
  },
  {
    id: 4,
    name: "I.A. Assistente",
    icon: <Icon icon="mdi:robot" />,
    path: "/setting/ia-assistent",
  },
  {
    id: 5,
    name: "Consulta jurídica",
    icon: <Icon icon="octicon:law-16" />,
    path: "/setting/legal-consultation",
  },
  {
    id: 6,
    name: "Conexão WhatsApp",
    icon: <Icon icon="mdi:plug" />,
    path: "/setting/whatsapp-connection",
  },
  {
    id: 7,
    name: "Serviços oferecidos",
    icon: <Icon icon="octicon:law-16" />,
    path: "/setting/service",
  },
  {
    id: 8,
    name: "Dúvidas frequentes",
    icon: <Icon icon="mingcute:question-fill" />,
    path: "/setting/question",
  },
  {
    id: 9,
    name: "Notificações",
    icon: <Icon icon="mdi:message-notification" />,
    path: "/setting/notifications",
  },
]
