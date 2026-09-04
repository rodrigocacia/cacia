import { z } from "zod"

export const legalConsultationFormSchema = z
  .object({
    is_charged: z
      .string()
      .min(1, { message: "Insira um tipo de valor válido" }),
    consultation_value: z.string().optional().nullable(),
    requires_payment_to_schedule: z
      .string()
      .min(1, { message: "Insira um tipo de valor válido" }),
    lawyer_pix_key: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.is_charged === "yes") {
        return !!data.consultation_value?.trim()
      }
      return true
    },
    {
      path: ["consultation_value"],
      message: "Campo obrigatório",
    }
  )
  .refine(
    (data) => {
      if (
        data.is_charged === "yes" &&
        data.requires_payment_to_schedule === "yes"
      ) {
        return !!data.lawyer_pix_key?.trim()
      }
      return true
    },
    {
      path: ["lawyer_pix_key"],
      message: "Campo obrigatório",
    }
  )

export type LegalConsultationFormData = z.infer<
  typeof legalConsultationFormSchema
>
