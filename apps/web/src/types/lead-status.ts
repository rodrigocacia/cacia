/**
 * Os valores que a API devolve. Eram minúsculos ("new"), que é como o status
 * é gravado no banco — mas não é o que sai no JSON, e por isso o LeadBadge
 * nunca achava o estilo do status recebido.
 */
export type LeadStatus = "NEW" | "IN_CONTACT" | "CONVERTED" | "LOST"

export function isValidLeadStatus(
  status: string | null | undefined
): status is LeadStatus {
  return ["NEW", "IN_CONTACT", "CONVERTED", "LOST"].includes(
    status as LeadStatus
  )
}
