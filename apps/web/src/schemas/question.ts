import { z } from "zod"

export const createQuestionFormSchema = z.object({
  title: z.string().min(1, { message: "Insira um cliente válido" }),
  description: z.string().min(1, { message: "Insira uma descrição" }),
})

export type CreateQuestionFormData = z.infer<typeof createQuestionFormSchema>
