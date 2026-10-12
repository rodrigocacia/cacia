import { LeadStatus } from "./lead-status"

export interface Lead {
  _id: string
  office: string
  name: string
  remotejid: string
  email: string
  status: LeadStatus
  last_activity_at: string | null
  delete_at: null
  events: never[]
  documents: never[]
  customer: string
  created_at: string
  updated_at: string
  __v: number
}
