import { z } from "zod"

export const schema = z
  .object({
    title: z
      .string({ message: "Insira o nome da Agenda" })
      .min(1, { message: "Nome é obrigatório" }),
    general_roles: z.string().optional(),
    user: z.string({ message: "Responsável é obrigatório" }),
    available_days: z.array(
      z.object({
        day: z.enum([
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
          "SATURDAY",
          "SUNDAY",
        ]),
        available: z.boolean(),
        start_time: z.string(),
        end_time: z.string(),
        online: z.boolean().default(false),
        in_person: z.boolean().default(false),
        shift2_available: z.boolean(),
        shift2_start_time: z.string(),
        shift2_end_time: z.string(),
        shift2_online: z.boolean().default(false),
        shift2_in_person: z.boolean().default(false),
      })
    ),
  })
  .superRefine((data, ctx) => {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
    const hasAvailableDay = data.available_days.some(
      (dayItem) =>
        dayItem.available &&
        timeRegex.test(dayItem.start_time) &&
        timeRegex.test(dayItem.end_time)
    )

    if (!hasAvailableDay) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "É necessário marcar pelo menos um dia da semana como disponível com horários válidos",
        path: ["available_days"],
      })
      return
    }

    data.available_days.forEach((dayItem, index) => {
      if (dayItem.available) {
        if (!timeRegex.test(dayItem.start_time)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Horário de início inválido. Use HH:MM",
            path: ["available_days", index, "start_time"],
          })
        }
        if (!timeRegex.test(dayItem.end_time)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Horário de fim inválido. Use HH:MM",
            path: ["available_days", index, "end_time"],
          })
        }
      }

      if (dayItem.shift2_available) {
        if (!timeRegex.test(dayItem.shift2_start_time)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Início do segundo turno inválido. Use HH:MM",
            path: ["available_days", index, "shift2_start_time"],
          })
        }
        if (!timeRegex.test(dayItem.shift2_end_time)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Fim do segundo turno inválido. Use HH:MM",
            path: ["available_days", index, "shift2_end_time"],
          })
        }
      }
    })
  })

export type AgendaDetailFormData = z.infer<typeof schema>
