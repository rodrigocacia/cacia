import { Process } from "./process"
import { UserReminder } from "@/schemas/event"

export enum EventType {
  MEETING = "meeting",
  HEARING = "hearing",
  INQUIRY = "inquiry",
  DEADLINE = "deadline",
  COMMITMENT = "commitment",
  SERVICE = "service",
}

export enum EventStatus {
  PENDING = "pending",
  CONFIRM = "confirm",
  CANCEL = "cancel",
  DONE = "done",
}

export interface Event {
  _id: string
  office: string
  lead: {
    _id: string
    name: string
  }
  customer: {
    _id: string
    name: string
  }
  calendar: {
    _id: string
    title: string
  }
  type: EventType
  title: string
  description: string
  start_time: string
  end_time: string
  status: EventStatus
  process?: Process
  consultation_mode: string
  user_reminder?: UserReminder[]
  deleted_at: null
  created_at: string
  updated_at: string
  custom_start_time: string
  custom_end_time: string
  __v: number
}
