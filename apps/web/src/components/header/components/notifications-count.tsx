"use client"

import { useUnreadNotification } from "@/http/hooks/notification"
import { Bell } from "lucide-react"
import Link from "next/link"

export function NotificationsCount() {
  const { unreadCount } = useUnreadNotification()

  return (
    <Link
      href="/notification"
      className="cursor-pointer relative w-[38px] h-[38px] flex items-center justify-center rounded-2xl bg-white shadow-md"
    >
      <Bell size={18} />

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-2 px-1.5 py-0.5 flex items-center justify-center rounded-full bg-[#348C98] font-bold text-xs text-white border border-white">
          {unreadCount}
        </span>
      )}
    </Link>
  )
}
