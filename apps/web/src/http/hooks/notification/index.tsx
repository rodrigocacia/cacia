import useSWR from "swr"

import {
  getNotification,
  GetNotificationResponse,
} from "@/http/notification/get-notification"
import {
  getNotificationUnreadCount,
  GetNotificationUnreadCountResponse,
} from "@/http/notification/get-notification-unread-count"

export function useNotification(page: number, type?: string) {
  const { data, error, isLoading, mutate } = useSWR<GetNotificationResponse>(
    ["notification", page, type],
    () => getNotification({ page, type: type ?? "" })
  )

  return {
    notifications: data?.data ?? [],
    totalItems: data?.totalItems ?? 0,
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.currentPage ?? 1,
    perPage: data?.perPage ?? 10,
    isLoading,
    isError: !!error,
    mutate,
  }
}

export function useUnreadNotification() {
  const { data, error, isLoading, mutate } =
    useSWR<GetNotificationUnreadCountResponse>(["notificationunread"], () =>
      getNotificationUnreadCount()
    )

  return {
    unreadCount: data ?? 0,
    isLoading,
    isError: !!error,
    mutate,
  }
}
