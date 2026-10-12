"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"

import {
  Bell,
  CalendarDays,
  Eye,
  FileCheck,
  MailWarning,
  MoreVertical,
  RefreshCw,
  Trash2,
  type LucideIcon,
} from "lucide-react"
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

import { Cartao } from "../setting/_ui/cartao"

const icons: Record<string, LucideIcon> = {
  process_update: RefreshCw,
  new_event: CalendarDays,
  confirm_doc: FileCheck,
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
      <Cartao titulo="Notificações">
        <Spinner />
      </Cartao>
    )

  if (totalItems === 0) {
    return (
      <Cartao titulo="Notificações">
        <EmptySearch
          title="Nenhum resultado encontrado!"
          subtitle="Não há notificações que correspondam à pesquisa."
        />
      </Cartao>
    )
  }

  const changeStatusNotification = async (
    notificationId: string,
    type: string,
    type_id: string
  ) => {
    try {
      if (type !== NotificationType.CONFIRM_DOC) {
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
    <Cartao
      titulo={
        <span className="flex items-baseline gap-2">
          Notificações
          <span className="font-mono text-xs font-normal text-tinta-3 tabular">
            {totalItems}
          </span>
        </span>
      }
      descricao={
        <span className="tabular">
          {notificationUnreadCount === 1
            ? "1 não lida"
            : `${notificationUnreadCount} não lidas`}
        </span>
      }
      semRecuo
    >
      <ul className="flex flex-col">
        {notifications.map((notification) => {
          const formatted = format(
            new Date(notification.created_at),
            "'Dia' d 'de' MMMM 'às' HH:mm",
            {
              locale: ptBR,
            }
          )

          const lida = notification.status === "open"
          const Icone = icons[notification.type] ?? Bell

          const abrir = () =>
            notification.type === NotificationType.CONFIRM_DOC
              ? handleNotificationClick(notification)
              : changeStatusNotification(
                  notification._id,
                  notification.type,
                  notification.type_id
                )

          return (
            <li
              key={notification._id}
              className="flex items-center gap-1 border-t border-[#F1EEE8] pr-4 first:border-t-0 max-md:pr-2"
            >
              <div
                role="button"
                tabIndex={0}
                onClick={abrir}
                onKeyDown={(evento) => {
                  if (evento.key === "Enter" || evento.key === " ") {
                    evento.preventDefault()
                    abrir()
                  }
                }}
                className="flex min-w-0 flex-grow cursor-pointer items-center gap-3 py-3.5 pl-7 transition-colors outline-none hover:bg-[#FBFAF7] focus-visible:bg-[#FBFAF7] max-md:pl-5"
              >
                <span
                  className={clsx(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]",
                    lida
                      ? "bg-[#F6F4EF] text-tinta-3"
                      : "bg-nevoa text-turquesa-profundo"
                  )}
                >
                  <Icone size={17} strokeWidth={1.7} aria-hidden />
                </span>

                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex items-center gap-2">
                    {!lida && (
                      <span
                        aria-label="Não lida"
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-acao"
                      />
                    )}
                    <span
                      className={clsx(
                        "truncate text-[14px]",
                        lida ? "text-tinta-2" : "font-medium text-tinta"
                      )}
                    >
                      {
                        notificationTypes[
                          notification.type as keyof typeof notificationTypes
                        ]
                      }{" "}
                      · {notification.type_title}
                    </span>
                  </span>
                  <p className="truncate text-[12.5px] text-tinta-3">
                    {formatted} · {notification.type_detail}
                  </p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 shrink-0 p-0 text-tinta-3 hover:text-tinta"
                  >
                    <span className="sr-only">Abrir menu</span>
                    <MoreVertical size={16} />
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
                    <Eye size={15} strokeWidth={1.7} className="text-tinta-3" />
                    <span className="text-[13.5px] text-tinta">Ver</span>
                  </DropdownMenuItem>

                  {lida && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()

                        handleChangeStatusNotificatonForDelivery(
                          notification._id
                        )
                      }}
                    >
                      <MailWarning
                        size={15}
                        strokeWidth={1.7}
                        className="text-tinta-3"
                      />
                      <span className="text-[13.5px] text-tinta">
                        Marcar não lida
                      </span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()

                      handleAddDeleteNotificationId(notification._id)
                    }}
                  >
                    <Trash2
                      size={15}
                      strokeWidth={1.7}
                      className="text-[#A23B2A]"
                    />
                    <span className="text-[13.5px] text-[#A23B2A]">
                      Excluir
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          )
        })}
      </ul>

      <div className="w-full border-t border-filete px-7 py-4 max-md:px-5">
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
    </Cartao>
  )
}
