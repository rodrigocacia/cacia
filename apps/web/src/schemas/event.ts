import { z } from "zod"

const userReminderSchema = z.object({
  _id: z.string().optional(),
  office: z.string().optional(),
  user: z.string().optional(),
  event: z.string().optional(),
  lead: z.string().optional(),
  customer: z.string().optional(),
  process: z.string().optional(),
  type: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  time_trigger: z.number().min(1, { message: "Tempo deve ser maior que 0" }),
  trigger_at: z.string().optional(),
  status: z.string().optional(),
  sent_at: z.string().optional(),
  error_message: z.string().optional(),
  retry_count: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().optional(),
})

export const createEventFormSchema = z.object({
  calendar_id: z.string().min(1, { message: "Insira um calendário válido" }),
  customer_id: z.string().nullable().optional(),
  process_id: z.string().nullable().optional(),
  type: z.string().min(1, { message: "Insira um tipo de evento válido" }),
  title: z.string().min(1, { message: "Insira um título válido" }),
  status: z.string().min(1, { message: "Insira um status válido" }),
  description: z.string().min(1, { message: "Insira uma descrição" }),
  start_date: z.string().min(1, { message: "Insira uma data válida" }),
  start_time: z.string().min(1, { message: "Insira um horário válido" }),
  end_date: z.string().min(1, { message: "Insira uma data válida" }),
  end_time: z.string().min(1, { message: "Insira um horário válido" }),
  user_reminder: z.array(userReminderSchema).optional(),
  consultation_mode: z.enum(["online", "in_person"]),
  lead_id: z.string().nullable().optional(),
})

export type CreateEventFormData = z.infer<typeof createEventFormSchema>
export type UserReminder = z.infer<typeof userReminderSchema>
