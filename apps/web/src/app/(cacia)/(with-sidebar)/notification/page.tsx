import { CustomTab } from "@/components/ui/custom-tab"
import { NotificationList } from "./detail"
import { tabs } from "./components/tabs"
import { Icon } from "@iconify/react/dist/iconify.js"
import { getNotification } from "@/http/notification/get-notification"
import { SWRConfig } from "swr"
import { getNotificationUnreadCount } from "@/http/notification/get-notification-unread-count"

export default async function ProccessDetail({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>
}) {
  const { page, type } = await searchParams

  const notification = await getNotification({
    page: Number(page) || 1,
    type,
  })

  const notificationUnreadCount = await getNotificationUnreadCount()

  return (
    <div className="w-full h-full">
      <div className="h-full max-md:hidden">
        <NotificationList notificationUnreadCount={notificationUnreadCount} />
      </div>

      <main className="w-full bg-red-100 h-fit max-lg:h-full pb-6 max-lg:pb-0  grid grid-cols-[2fr_3fr] max-lg:flex max-lg max-lg:flex-col max-lg:justify-between md:hidden">
        <div className="relative flex flex-1 flex-col px-4 pt-2 pb-10  bg-[url('/bg-login.png')] bg-cover bg-center h-[160px] w-full lg:hidden -mb-6 z-0"></div>

        <div className="bg-white relative z-10 w-full max-lg:h-fit flex flex-col rounded-t-4xl px-4 py-10 max-lg:pb-0">
          <div className="w-full max-h-[360px]">
            <div className="flex flex-col items-center gap-[17px] relative -top-18">
              <div className="flex w-[86px] h-[86px] items-center justify-center bg-[#ECF7F8] rounded-[30px]">
                <Icon
                  icon="mingcute:notification-fill"
                  className="w-[46px] h-[46px] text-[#348C98]"
                />
              </div>

              <h2 className="text-[20px] text-[#3D3D3D] font-bold">
                Central de notificações
              </h2>
            </div>

            <CustomTab tabs={tabs} />

            <SWRConfig
              value={{
                fallback: {
                  notification: notification,
                },
                revalidateOnFocus: false,
                revalidateIfStale: true,
                revalidateOnReconnect: false,
                refreshInterval: 0,
              }}
            >
              <NotificationList
                notificationUnreadCount={notificationUnreadCount}
              />
            </SWRConfig>
          </div>
        </div>
      </main>
    </div>
  )
}
