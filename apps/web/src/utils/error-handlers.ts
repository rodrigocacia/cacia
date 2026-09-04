const fieldLabels: Record<string, string> = {
  "address.street": "Logradouro",
  "address.number": "Número",
  "address.cep": "CEP",
  "address.neighborhood": "Bairro",
  "address.city": "Cidade",
  "address.state": "Estado",
  street: "Logradouro",
  number: "Número",
  cep: "CEP",
  neighborhood: "Bairro",
  city: "Cidade",
  state: "Estado",
  user_name: "Nome do usuário",
  user_email: "E-mail",
  user_phone: "Telefone",
  document: "Documento",
  oab_number: "Número da OAB",
  legal_name: "Razão social",
  trade_name: "Nome fantasia",
}

export function parseValidationError(errorMessage: string | string[]): string {
  if (Array.isArray(errorMessage)) {
    const firstError = errorMessage[0]

    if (firstError.includes("should not be empty")) {
      const field = firstError.split(" ")[0]
      const fieldName = fieldLabels[field] || field
      return `O campo ${fieldName} é obrigatório ao preencher o endereço`
    }

    if (firstError.includes("is required")) {
      const field = firstError.split(" ")[0]
      const fieldName = fieldLabels[field] || field
      return `O campo ${fieldName} é obrigatório`
    }

    return firstError
  }

  if (typeof errorMessage === "string") {
    return errorMessage
  }

  return "Erro ao processar solicitação"
}

export function parseAddressValidationError(errorMessages: string[]) {
  const firstError = errorMessages[0]

  const errorMappings = [
    {
      pattern: "address.number should not be empty",
      field: "number",
      message: "O número é obrigatório ao preencher o endereço",
    },
    {
      pattern: "address.cep should not be empty",
      field: "cep",
      message: "O CEP é obrigatório ao preencher o endereço",
    },
    {
      pattern: "address.street should not be empty",
      field: "street",
      message: "O logradouro é obrigatório ao preencher o endereço",
    },
    {
      pattern: "address.neighborhood should not be empty",
      field: "neighborhood",
      message: "O bairro é obrigatório ao preencher o endereço",
    },
    {
      pattern: "address.city should not be empty",
      field: "city",
      message: "A cidade é obrigatória ao preencher o endereço",
    },
    {
      pattern: "address.state should not be empty",
      field: "state",
      message: "O estado é obrigatório ao preencher o endereço",
    },
  ]

  const errorInfo = errorMappings.find((mapping) =>
    firstError.includes(mapping.pattern)
  )

  return errorInfo || null
}
