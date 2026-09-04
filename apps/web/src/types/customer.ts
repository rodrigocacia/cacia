import { Address } from "./address"

export interface Customer {
  _id: string
  office: string
  name: string
  remotejid: string
  email?: string
  document: string
  legal_name: string
  trade_name: string
  address?: Address[]
  delete_at: null
  process: []
  documents: []
  events: []
  created_at: string
  updated_at: string
  __v: 0
}
