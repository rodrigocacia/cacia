export function formatDocument(document: string): string {
  if (!document) return ""

  const cleaned = document.replace(/\D/g, "")

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  if (cleaned.length === 14) {
    return cleaned.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    )
  }

  return document
}

export function formatPhone(phone: string): string {
  if (!phone) return ""

  const cleaned = phone.replace(/\D/g, "")

  if (cleaned.length === 13) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "+$1 ($2) $3-$4")
  }

  if (cleaned.length === 12) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, "+$1 ($2) $3-$4")
  }

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }

  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
  }

  return phone
}

export function getDocumentType(document: string): "CPF" | "CNPJ" {
  if (!document) return "CPF"

  const cleaned = document.replace(/\D/g, "")
  return cleaned.length === 11 ? "CPF" : "CNPJ"
}

export function formatProcess(processNumber: string): string {
  if (!processNumber) return ""

  const cleaned = processNumber.replace(/\D/g, "")

  if (processNumber.includes("-") || processNumber.includes(".")) {
    return processNumber
  }

  let formatted = cleaned

  if (cleaned.length >= 9) {
    formatted = formatted.replace(/^(\d{7})(\d{2})/, "$1-$2")
  }

  if (cleaned.length >= 13) {
    formatted = formatted.replace(/^(\d{7}-\d{2})(\d{4})/, "$1.$2")
  }

  if (cleaned.length >= 14) {
    formatted = formatted.replace(/^(\d{7}-\d{2}\.\d{4})(\d{1})/, "$1.$2")
  }

  if (cleaned.length >= 16) {
    formatted = formatted.replace(
      /^(\d{7}-\d{2}\.\d{4}\.\d{1})(\d{2})/,
      "$1.$2"
    )
  }

  if (cleaned.length >= 20) {
    formatted = formatted.replace(
      /^(\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2})(\d{4})/,
      "$1.$2"
    )
  }

  return formatted
}

export function convertCurrencyToNumber(value: string): number {
  if (!value || !value.trim()) return 0
  const cleanValue = value
    .replace(/R\$\s*/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
  return Number(cleanValue) || 0
}

export function formatNumberToCurrency(
  value: number | null | undefined
): string {
  if (!value) return ""
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatTime(dateString: string) {
  return dateString.substring(11, 16)
}

export function formatName(name: string): string {
  if (!name || typeof name !== "string") return ""

  return name.trim().toUpperCase()
}

/**
 * "R$ 1.250,50" → 1250.5
 *
 * Valores em reais, como a API guarda (`Decimal(12, 2)`). O sistema anterior
 * guardava centavos; mandar centavos para a API nova multiplicava o preço da
 * consulta por cem — no cadastro e no que a IA informa ao cliente.
 */
export function convertCurrencyToReais(value: string): number {
  return convertCurrencyToCents(value) / 100
}

export function convertCurrencyToCents(value: string): number {
  if (!value || !value.trim()) return 0
  const cleanValue = value
    .replace(/R\$\s*/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
  const numberValue = Number(cleanValue)
  return Math.round(numberValue * 100) || 0
}
