export enum NotificationType {
  PROCESS_UPDATE = "process_update",
  PROGRESS_UPDATE = "progress_update",
  NEW_EVENT = "new_event",
  CONFIRM_DOC = "confirm_doc",
  NEW_LEAD = "new_lead",
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
