export enum NotificationType {
  PROCESS_UPDATE = "PROCESS_UPDATE",
  PROGRESS_UPDATE = "PROGRESS_UPDATE",
  NEW_EVENT = "NEW_EVENT",
  CONFIRM_DOC = "CONFIRM_DOC",
  NEW_LEAD = "NEW_LEAD",
}

export interface Notification {
  _id: string
  office: string
  user: string
  type: string
  type_id: string
  type_title: string
  type_detail: string
  status: string
  deleted_at: string | null
  created_at: string
  updated_at: string
  __v: number
}
