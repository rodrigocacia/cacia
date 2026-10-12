import { NotificationList } from "./detail"
import { getNotificationUnreadCount } from "@/http/notification/get-notification-unread-count"

export default async function ProccessDetail() {
  const notificationUnreadCount = await getNotificationUnreadCount()

  // Uma instância só da lista: antes havia uma por largura de tela, e as duas
  // abriam o mesmo diálogo de exclusão ao mesmo tempo.
  return <NotificationList notificationUnreadCount={notificationUnreadCount} />
}
