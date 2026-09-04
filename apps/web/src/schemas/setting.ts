import { z } from "zod"

export const settingFormSchema = z.object({
  n_w_c_new_event: z.boolean(),
  n_w_c_update_process: z.boolean(),
  n_w_a_new_lead: z.boolean(),
  n_w_a_new_mark_lead: z.boolean(),
  n_w_a_new_mark_customer: z.boolean(),
  n_w_a_new_event: z.boolean(),
  n_w_a_update_process: z.boolean(),
  n_w_a_update_system: z.boolean(),
})

export type SettinFormData = z.infer<typeof settingFormSchema>
