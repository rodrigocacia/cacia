"use client"

import { Icon } from "@iconify/react/dist/iconify.js"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"

import { MoreVertical } from "lucide-react"
import { CustomPagination } from "@/components/ui/custom-pagination"

import {
  useNotification,
  useUnreadNotification,
} from "@/http/hooks/notification"
import { Spinner } from "@/components/ui/sppiner"
import { EmptySearch } from "@/components/empty-search"
import { useRouter, useSearchParams } from "next/navigation"
import { NotificationType, Notification } from "@/types/notification"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { updateStatusNotification } from "@/http/notification/update-status-notification"
import clsx from "clsx"
import { useState } from "react"
import { DocumentApprovalModal } from "@/components/document/document-approval-modal"
import { DialogDeleteNotification } from "./components/dialog-delete-notification"
import { Toast } from "@/components/ui/toast"
import { updateStatusNotificationForDelivery } from "@/http/notification/update-status-notification-for-delivery"

const icons = {
  process_update: "uim:process",
  new_event: "mdi:calendar",
  confirm_doc: "mdi:file-document-check",
}

const notificationTypes = {
  [NotificationType.PROCESS_UPDATE]: "Processo atualizado",
  [NotificationType.NEW_EVENT]: "Novo evento",
  [NotificationType.CONFIRM_DOC]: "Confirmação de documento",
}

const redirects = (type: string, type_id: string) => {
  return {
    [NotificationType.PROCESS_UPDATE]: `/process/${type_id}/information`,
    [NotificationType.NEW_EVENT]: `/event?eventId=${type_id}`,
    [NotificationType.CONFIRM_DOC]: `/document/${type_id}`,
    [NotificationType.PROGRESS_UPDATE]: `/process/${type_id}/progress`,
  }[type]
}

export function NotificationList({
  notificationUnreadCount,
}: {
  notificationUnreadCount: number
}) {
  const searchParams = useSearchParams()
  const page = Number(searchParams.get("page")) || 1
  const type = searchParams.get("type")
  const deleteId = searchParams.get("deleteId")

  const router = useRouter()

  const [isSuccess, setIsSuccess] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [selectedDocumentId, setSelectedDocumentId] = useState<string>()
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)

  const {
    notifications,
    totalItems,
    totalPages,
    currentPage,
    perPage,
    isLoading,
  } = useNotification(page, type ? String(type) : undefined)

  const { mutate } = useUnreadNotification()

  const { mutate: mutateNotification } = useNotification(1)

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === NotificationType.CONFIRM_DOC) {
      setSelectedDocumentId(notification.type_id)
      setIsApprovalModalOpen(true)
    }
  }

  const handleCloseApprovalModal = () => {
    setIsApprovalModalOpen(false)
    setSelectedDocumentId(undefined)
  }

  if (isLoading)
    return (
      <div className="w-full p-8 max-md:p-0 md:rounded-2xl md:shadow-sm">
        <Spinner />
      </div>
    )

  if (totalItems === 0) {
    return (
      <EmptySearch
        title="Nenhum resultado encontrado!"
        subtitle="Não há notificações que correspondam à pesquisa."
      />
    )
  }

  const changeStatusNotification = async (
    notificationId: string,
    type: string,
    type_id: string
  ) => {
    try {
      if (type !== "confirm_doc") {
        await updateStatusNotification({
          notification_id: notificationId,
        })

        mutate()
      }

      router.replace(redirects(type, type_id) ?? "")
    } catch {}
  }

  const handleChangeStatusNotificatonForDelivery = async (
    notificationId: string
  ) => {
    try {
      await updateStatusNotificationForDelivery({
        notification_id: notificationId,
      })

      mutate()

      mutateNotification()
    } catch {}
  }

  const handleAddDeleteNotificationId = (notificationId: string) => {
    const params = new URLSearchParams(searchParams)

    params.set("deleteId", notificationId)

    router.push(`/notification?${params.toString()}`)
  }

  const handleRemoveDeleteQuestionId = () => {
    const params = new URLSearchParams(searchParams)

    params.delete("deleteId")

    router.push(`/notification?${params.toString()}`)
  }

  return (
    <div className="w-full p-8 max-md:p-0 md:rounded-2xl md:shadow-sm">
      <div className="w-full flex items-center gap-3 max-md:hidden">
        <Icon icon="mdi:notifications" className="text-[#BDBDBD] w-8 h-8" />

        <h3 className="text-[20px] text-[#707070] font-bold">
          Todas as notificações
        </h3>
      </div>

      <hr className="w-full my-6 max-md:my-2 h-px border-t-0 bg-gray-200 max-md:hidden" />

      <div className="flex items-center gap-1 max-md:mt-6">
        <Icon icon="mingcute:alert-fill" className="text-[#BDBDBD] w-5 h-5" />

        <h2 className="text-sm text-[#3D3D3D] font-semibold">
          Não lidas ({notificationUnreadCount})
        </h2>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        {notifications.map((notification) => {
          const formatted = format(
            new Date(notification.created_at),
            "'Dia' d 'de' MMMM 'às' HH:mm",
            {
              locale: ptBR,
            }
          )

          const notificationContent = (
            <div className="flex items-center justify-between rounded-[12px] border border-[#F6F6F9] shadow-sm py-3 px-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={clsx(
                    "flex items-center justify-center bg-[#ECF7F8] p-2.5 rounded-[12px]",
                    notification.status === "open" && "opacity-65"
                  )}
                >
                  {icons[notification.type as keyof typeof icons] && (
                    <Icon
                      icon={
                        icons[notification.type as keyof typeof icons] ??
                        "mdi:question-mark"
                      }
                      className={clsx(
                        "w-6 h-6",
                        notification.status === "open"
                          ? "text-[#BDBDBD]"
                          : "text-[#348C98]"
                      )}
                    />
                  )}
                </div>
                <div>
                  <h4
                    className={clsx(
                      "text-base text-[#707070] font-semibold",
                      notification.status === "open" && "opacity-65"
                    )}
                  >
                    {
                      notificationTypes[
                        notification.type as keyof typeof notificationTypes
                      ]
                    }{" "}
                    - {notification.type_title}
                  </h4>
                  <div className="flex">
                    <p
                      className={clsx(
                        "text-[12px] text-[#707070]",
                        notification.status === "open" && "opacity-65"
                      )}
                    >
                      {formatted} | {notification.type_detail}
                    </p>
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      changeStatusNotification(
                        notification._id,
                        notification.type,
                        notification.type_id
                      )
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:eye" className="text-[#348C98] w-5 h-5" />

                      <p className="text-base text-[#3D3D3D]">Ver</p>
                    </div>
                  </DropdownMenuItem>

                  {notification.status === "open" && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()

                        handleChangeStatusNotificatonForDelivery(
                          notification._id
                        )
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          icon="mdi:alert"
                          className="text-[#348C98] w-5 h-5"
                        />

                        <p className="text-base text-[#3D3D3D]">
                          Marcar não lida
                        </p>
                      </div>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()

                      handleAddDeleteNotificationId(notification._id)
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        icon="mdi:delete"
                        className="text-[#DC2626] w-5 h-5"
                      />

                      <p className="text-base text-[#3D3D3D]">Excluir</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )

          return notification.type === NotificationType.CONFIRM_DOC ? (
            <div
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className="cursor-pointer"
            >
              {notificationContent}
            </div>
          ) : (
            <div
              key={notification._id}
              onClick={() =>
                changeStatusNotification(
                  notification._id,
                  notification.type,
                  notification.type_id
                )
              }
              className="cursor-pointer"
            >
              {notificationContent}
            </div>
          )
        })}
      </div>

      <div className="w-full mt-10">
        <CustomPagination
          totalItems={totalItems}
          totalPages={totalPages}
          currentPage={currentPage}
          perPage={perPage}
        />
      </div>

      <DocumentApprovalModal
        documentId={selectedDocumentId}
        isOpen={isApprovalModalOpen}
        onClose={handleCloseApprovalModal}
      />

      <DialogDeleteNotification
        isOpen={!!deleteId}
        id={deleteId ?? ""}
        onClose={handleRemoveDeleteQuestionId}
        setIsSuccess={setIsSuccess}
        setHasError={setHasError}
        setErrorMessage={setErrorMessage}
      />

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title="Erro ao excluir notificação!"
          description={errorMessage}
        />
      )}

      {isSuccess && (
        <Toast
          onClose={() => setIsSuccess(false)}
          variant="successSolid"
          title="Notificação excluída com sucesso!"
          description="A notificação foi excluída com sucesso."
        />
      )}
    </div>
  )
}
