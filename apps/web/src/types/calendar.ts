export interface AvailableDay {
  day:
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY"
  available: boolean
  start_time: string
  end_time: string
  online: boolean
  in_person: boolean
  shift2_available: boolean
  shift2_start_time: string
  shift2_end_time: string
  shift2_online: boolean
  shift2_in_person: boolean
}

export interface Calendar {
  _id: string
  /** A API devolve o responsável como objeto; o id está em `user_id` */
  user: string | { _id: string; name: string }
  user_id?: string
  office: string
  title: string
  general_available: string
  general_roles: string
  cancel_roles: string
  notification: boolean
  status: boolean
  deleted_at: null
  created_at: string
  updated_at: string
  available_days: AvailableDay[]
  __v: number
}
