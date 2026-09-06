export enum ReminderType {
  CUSTOM = "CUSTOM",
  EVENT = "EVENT",
}

export enum ReminderStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED",
}

export interface Reminder {
  _id: string
  office: string
  user: string
  event?: string
  lead?: string
  customer?: string
  process?: string
  type: ReminderType
  title: string
  description?: string
  time_trigger: number
  trigger_at: string
  status: ReminderStatus
  sent_at?: string
  error_message?: string
  retry_count: number
  created_at: string
  updated_at: string
  deleted_at?: string
}
