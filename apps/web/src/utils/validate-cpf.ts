export function validateCpf(document: string): boolean {
  if (typeof document !== "string") {
    return false
  }

  // Remove todos os caracteres não numéricos
  document = document.replace(/[^\d]+/g, "")

  // Verifica se a quantidade de dígitos está correta
  if (document.length !== 11) {
    return false
  }

  // Verifica se todos os dígitos são iguais (ex: 11111111111)
  if (/^(\d)\1{10}$/.test(document)) {
    return false
  }

  // Converte os dígitos em um array de números
  const digits = document.split("").map(Number)

  // Valida os dois dígitos verificadores
  const firstDigitIsValid = calculateDigit(digits.slice(0, 9)) === digits[9]
  const secondDigitIsValid = calculateDigit(digits.slice(0, 10)) === digits[10]

  return firstDigitIsValid && secondDigitIsValid
}

// Função auxiliar para calcular cada dígito verificador
const calculateDigit = (digits: number[]): number => {
  const sum = digits.reduce(
    (acc, digit, index) => acc + digit * (digits.length + 1 - index),
    0
  )

  const remainder = sum % 11
  return remainder < 2 ? 0 : 11 - remainder
}
