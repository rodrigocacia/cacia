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

/**
 * Campo obrigatório com a mesma mensagem para vazio e para ausente.
 *
 * Sem o `required_error`, um campo que nunca foi tocado chega como `undefined`
 * e o zod responde com o "Required" padrão, em inglês.
 */
function obrigatorio(mensagem: string) {
  return z
    .string({ required_error: mensagem, invalid_type_error: mensagem })
    .min(1, { message: mensagem })
}

export const createEventFormSchema = z.object({
  calendar_id: obrigatorio("Insira um calendário válido"),
  customer_id: z.string().nullable().optional(),
  process_id: z.string().nullable().optional(),
  type: obrigatorio("Insira um tipo de evento válido"),
  title: obrigatorio("Insira um título válido"),
  // Só existe na edição: o compromisso novo sempre nasce pendente e a API
  // recusa `status` na criação.
  status: z.string().optional(),
  description: obrigatorio("Insira uma descrição"),
  start_date: obrigatorio("Insira uma data válida"),
  start_time: obrigatorio("Insira um horário válido"),
  end_date: obrigatorio("Insira uma data válida"),
  end_time: obrigatorio("Insira um horário válido"),
  user_reminder: z.array(userReminderSchema).optional(),
  // Os valores são os do enum da API, que é maiúsculo
  consultation_mode: z.enum(["ONLINE", "IN_PERSON"], {
    required_error: "Escolha a modalidade do evento",
    invalid_type_error: "Escolha a modalidade do evento",
  }),
  lead_id: z.string().nullable().optional(),
})

export type CreateEventFormData = z.infer<typeof createEventFormSchema>
export type UserReminder = z.infer<typeof userReminderSchema>
