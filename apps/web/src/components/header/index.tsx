import { SidebarTrigger } from "../ui/sidebar"
import { getNotificationUnreadCount } from "@/http/notification/get-notification-unread-count"
import { NotificationsCount } from "./components/notifications-count"
import { SWRConfig } from "swr"
import { nomeParaExibir } from "@/utils/formatters"

interface HeaderProps {
  title?: string
  name?: string
}

/**
 * Faixa do topo do painel: onde se está e os avisos.
 *
 * Fina e presa ao topo enquanto a página rola. O nome e o usuário saíram
 * daqui para o menu lateral; o título grande de cada tela fica com a própria
 * tela (PageHeader), em serifa.
 *
 * As margens negativas desfazem o recuo do painel, para que o filete de
 * baixo corra de ponta a ponta.
 */
export async function Header({ title, name }: HeaderProps) {
  const notificationunread = await getNotificationUnreadCount()

  return (
    <div className="sticky top-0 z-30 -mx-8 mb-6 flex h-[52px] items-center gap-3 border-b border-filete bg-papel/85 px-8 backdrop-blur max-lg:-mx-4 max-lg:px-4 md:rounded-t-[14px]">
      <SidebarTrigger className="-ml-1 lg:hidden" />

      <div className="flex min-w-0 flex-grow items-center gap-2 text-[13px]">
        {title ? (
          <span className={name ? "text-tinta-3" : "font-medium text-tinta"}>
            {title}
          </span>
        ) : null}

        {name ? (
          <>
            <span className="text-gray-400">/</span>
            <span className="truncate font-medium text-tinta">
              {nomeParaExibir(name)}
            </span>
          </>
        ) : null}
      </div>

      <SWRConfig
        value={{
          fallback: {
            notificationunread: notificationunread,
          },
          revalidateOnFocus: false,
          revalidateIfStale: false,
          revalidateOnReconnect: false,
          refreshInterval: 5000,
        }}
      >
        <NotificationsCount />
      </SWRConfig>
    </div>
  )
}
