export type LeadStatus = "new" | "in_contact" | "converted"

export function isValidLeadStatus(
  status: string | null | undefined
): status is LeadStatus {
  return ["new", "in_contact", "converted"].includes(status as LeadStatus)
}
