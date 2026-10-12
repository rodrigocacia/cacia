"use client"

import { useUnreadNotification } from "@/http/hooks/notification"
import { Bell } from "lucide-react"
import Link from "next/link"

export function NotificationsCount() {
  const { unreadCount } = useUnreadNotification()

  return (
    <Link
      href="/notification"
      aria-label={
        unreadCount > 0
          ? `${unreadCount} notificações não lidas`
          : "Notificações"
      }
      className="relative flex h-8 w-8 items-center justify-center rounded-lg text-tinta-2 transition-colors hover:bg-gray-100"
    >
      <Bell size={17} strokeWidth={1.7} />

      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-1 flex h-4 min-w-4 items-center justify-center rounded-[5px] bg-acao px-1 font-mono text-[10px] text-white">
          {unreadCount}
        </span>
      )}
    </Link>
  )
}
