import { Icon } from "@/components/icone"
import { NotificationType } from "@/types/notification"

export const tabs = [
  {
    id: 1,
    name: "Todas",
    param: "all",
    icon: <Icon icon="mingcute:notification-fill" className="w-5 h-5" />,
    path: "/notification",
  },
  {
    id: 2,
    name: "Documentos pendentes",
    param: NotificationType.CONFIRM_DOC,
    icon: <Icon icon="mdi:file-document-alert" className="w-5 h-5" />,
    path: `/notification?type=${NotificationType.CONFIRM_DOC}`,
  },
  {
    id: 3,
    name: "Novos compromissos",
    param: NotificationType.NEW_EVENT,
    icon: <Icon icon="mdi:calendar-check" className="w-5 h-5" />,
    path: `/notification?type=${NotificationType.NEW_EVENT}`,
  },
  {
    id: 4,
    name: "Atualizações processuais",
    param: NotificationType.PROCESS_UPDATE,
    icon: <Icon icon="uim:process" className="w-5 h-5" />,
    path: `/notification?type=${NotificationType.PROCESS_UPDATE}`,
  },
]
