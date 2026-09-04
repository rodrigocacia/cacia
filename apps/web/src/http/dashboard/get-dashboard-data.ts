import { getCurrentOfficeId } from "@/auth/auth"
import { api } from "../api-client"

interface Document {
  _id: string
  name: string
  url: string
  type: string
  created_at: string
}

interface Event {
  _id: string
  type: string
  description: string
  created_at: string
}

export interface DashboardData {
  summary: {
    chats: number
    leads: number
    customers: number
    processes: number
  }
  processStatus: Array<{
    _id: string
    total: number
  }>
  processType: Array<{
    _id: string
    total: number
  }>
  lastProcesses: Array<{
    _id: string
    office: string
    customer: {
      _id: string
      name: string
      document: string
    }
    unit: string
    number: string
    description: string
    status: string
    documents: Document[]
    events: Event[]
    progress: {
      _id: string
      title: string
      release_at: string
    }[]
    deleted_at: string | null
    last_activity_at: string | null
    created_at: string
    updated_at: string
    __v: number
    type: string
  }>
}

export async function getDashboardData(startDate?: string, endDate?: string) {
  const officeId = await getCurrentOfficeId()
  const response = await api
    .get(
      `dashboard/?office_id=${officeId}&startDate=${startDate}&endDate=${endDate}`,
      {
        next: {
          tags: ["dashboard"],
          revalidate: 60,
        },
      }
    )
    .json<DashboardData>()
  return response
}
