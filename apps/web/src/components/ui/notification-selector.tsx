"use client"

import React, { useState } from "react"
import { X, Bell } from "lucide-react"
import { UserReminder } from "@/schemas/event"
import { Button } from "./custom-button"
import { CustomSelect } from "./custom-select"
import { Input } from "./custom-input"
import { useReminder } from "@/http/hooks/reminder"
import { createReminder } from "@/http/reminder/create-reminder"
import { useEventById } from "@/http/hooks/event"
import { Toast } from "./toast"
import { DialogDeleteReminder } from "./dialog-delete-reminder"

interface NotificationSelectorProps {
  value?: UserReminder[]
  onChange: (reminders: UserReminder[]) => void
  label?: string
  eventId?: string
}

const timeUnitOptions = [
  { value: "minutes", label: "Minutos", multiplier: 1 },
  { value: "hours", label: "Horas", multiplier: 60 },
  { value: "days", label: "Dias", multiplier: 1440 },
]

export function NotificationSelector({
  value = [],
  onChange,
  label = "Notificações",
  eventId,
}: NotificationSelectorProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [timeValue, setTimeValue] = useState<string>("")
  const [timeUnit, setTimeUnit] = useState<string>("minutes")

  const [isAdding, setIsAdding] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false)
  const [reminderToDelete, setReminderToDelete] = useState<{
    id: string
    index: number
    label: string
  } | null>(null)

  const { reminders: apiReminders, mutate } = useReminder(eventId || "")

  const { event } = useEventById(eventId || "")

  const convertedApiReminders: UserReminder[] = (apiReminders || []).map(
    (reminder) => ({
      _id: reminder._id,
      time_trigger: reminder.time_trigger,
    })
  )

  const currentReminders = eventId ? convertedApiReminders : value
  const sortedReminders = [...currentReminders].sort(
    (a, b) => (a.time_trigger || 0) - (b.time_trigger || 0)
  )

  const addNotification = async () => {
    const numericValue = parseInt(timeValue)
    if (!numericValue || numericValue <= 0) {
      return
    }

    const unitConfig = timeUnitOptions.find((unit) => unit.value === timeUnit)
    if (!unitConfig) {
      return
    }

    const timeInMinutes = numericValue * unitConfig.multiplier

    const exists = currentReminders.some(
      (reminder) => reminder.time_trigger === timeInMinutes
    )

    if (exists) {
      return
    }

    if (eventId) {
      setIsAdding(true)

      try {
        if (!event?.start_time) {
          setErrorMessage("Não foi possível obter dados do evento")
          setShowError(true)
          setIsAdding(false)
          return
        }

        const eventStartTime = new Date(event.start_time)
        const triggerAt = new Date(
          eventStartTime.getTime() - timeInMinutes * 60 * 1000
        )

        const reminderData = {
          event: eventId,
          ...(event.customer && { customer: event.customer?._id }),
          ...(event.process && { process: event.process?._id }),
          title: `Lembrete: ${event.title}`,
          description: event.description,
          time_trigger: timeInMinutes,
          trigger_at: triggerAt.toISOString(),
        }

        const result = await createReminder(reminderData)

        if (result.success) {
          mutate()
        } else {
          setErrorMessage("Erro ao criar notificação")
          setShowError(true)
        }
      } catch {
        setErrorMessage("Erro ao criar notificação")
        setShowError(true)
      }

      setIsAdding(false)
    } else {
      const newReminder: UserReminder = {
        time_trigger: timeInMinutes,
      }
      onChange([...value, newReminder])
    }

    setTimeValue("")
    setTimeUnit("minutes")
    setShowAddForm(false)
  }

  const removeNotification = (index: number) => {
    const reminderToRemove = sortedReminders[index]

    if (eventId && reminderToRemove._id) {
      setReminderToDelete({
        id: reminderToRemove._id,
        index,
        label: getTimeLabel(reminderToRemove.time_trigger),
      })
      setDeleteModalOpen(true)
    } else {
      const idxInValue = value.findIndex(
        (r) => r.time_trigger === reminderToRemove.time_trigger
      )
      const newReminders = value.filter((_, i) => i !== idxInValue)
      onChange(
        newReminders.sort(
          (a, b) => (a.time_trigger || 0) - (b.time_trigger || 0)
        )
      )
    }
  }

  const handleDeleteSuccess = () => {
    setReminderToDelete(null)
    setDeleteModalOpen(false)
    setShowDeleteSuccess(true)

    // Aguarda o modal fechar antes de atualizar os dados
    setTimeout(() => {
      mutate()
    }, 300)
  }

  const handleDeleteError = (message: string) => {
    setErrorMessage(message)
    setShowError(true)
  }

  const handleDeleteClose = () => {
    setDeleteModalOpen(false)
    setReminderToDelete(null)
  }

  const getTimeLabel = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minuto${minutes > 1 ? "s" : ""} antes`
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      if (remainingMinutes === 0) {
        return `${hours} hora${hours > 1 ? "s" : ""} antes`
      } else {
        return `${hours}h ${remainingMinutes}min antes`
      }
    } else {
      const days = Math.floor(minutes / 1440)
      const remainingMinutes = minutes % 1440
      if (remainingMinutes === 0) {
        return `${days} dia${days > 1 ? "s" : ""} antes`
      } else {
        const hours = Math.floor(remainingMinutes / 60)
        const mins = remainingMinutes % 60
        let label = `${days}d`
        if (hours > 0) label += ` ${hours}h`
        if (mins > 0) label += ` ${mins}min`
        return `${label} antes`
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Bell size={16} strokeWidth={1.7} className="text-tinta-3" />
        <label className="text-[13px] font-medium text-tinta-2">{label}</label>
      </div>

      {sortedReminders.length > 0 && (
        <div className="flex flex-col gap-2">
          {sortedReminders.map((reminder, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-[10px] border border-filete bg-white py-2.5 pr-2 pl-3.5"
            >
              <div className="flex flex-col">
                <span className="text-[14px] font-medium text-tinta">
                  {getTimeLabel(reminder.time_trigger)}
                </span>
                <span className="text-xs text-tinta-3">via WhatsApp</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeNotification(index)}
                aria-label="Remover notificação"
                className="h-8! w-8! px-0! text-tinta-3 hover:bg-[#FBEDEA] hover:text-[#A23B2A]"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {showAddForm ? (
        <div className="flex flex-col gap-3 rounded-[12px] border border-filete bg-papel-2 p-3.5">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="number"
                iconName="clock"
                placeholder="Ex: 15"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                min="1"
              />
            </div>
            <div className="flex-1">
              <CustomSelect
                iconName="clock"
                options={timeUnitOptions.map((unit) => ({
                  value: unit.value,
                  label: unit.label,
                }))}
                value={timeUnit}
                onChange={(value: string) => setTimeUnit(value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddForm(false)
                setTimeValue("")
                setTimeUnit("minutes")
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={addNotification}
              disabled={!timeValue || parseInt(timeValue) <= 0 || isAdding}
              isLoading={isAdding}
              className="flex-1"
            >
              {isAdding ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAddForm(true)}
          className="w-full border-dashed text-tinta-2"
        >
          Adicionar notificação
        </Button>
      )}

      {currentReminders.length === 0 && !showAddForm && (
        <p className="py-1 text-center text-xs text-tinta-3">
          Nenhuma notificação configurada
        </p>
      )}

      {showError && (
        <Toast
          onClose={() => setShowError(false)}
          variant="errorSolid"
          title="Erro"
          description={errorMessage}
        />
      )}

      {showDeleteSuccess && (
        <Toast
          onClose={() => setShowDeleteSuccess(false)}
          variant="successSolid"
          title="Lembrete excluído com sucesso!"
          description="O lembrete foi removido com sucesso."
        />
      )}

      {reminderToDelete && (
        <DialogDeleteReminder
          reminderId={reminderToDelete.id}
          reminderLabel={reminderToDelete.label}
          isOpen={deleteModalOpen}
          onClose={handleDeleteClose}
          onSuccess={handleDeleteSuccess}
          onError={handleDeleteError}
        />
      )}
    </div>
  )
}
