/**
 * Valores de autoComplete recomendados para campos de entrada
 *
 * Uso:
 * <Input autoComplete={AUTOCOMPLETE_VALUES.NAME} />
 */
export const AUTOCOMPLETE_VALUES = {
  NAME: "name",
  EMAIL: "email",
  PHONE: "tel",
  CURRENT_PASSWORD: "current-password",
  NEW_PASSWORD: "new-password",
  STREET_ADDRESS: "street-address",
  ADDRESS_LEVEL2: "address-level2",
  POSTAL_CODE: "postal-code",
  COUNTRY: "country",
  ORGANIZATION: "organization",
  OFF: "off",
} as const

/**
 * Guia de referência para valores de autoComplete por iconName
 *
 * Esta referência ajuda a escolher o valor correto baseado no contexto do input
 */
export const AUTOCOMPLETE_RECOMMENDATIONS = {
  "iconName='person'": AUTOCOMPLETE_VALUES.NAME,
  "iconName='mail'": AUTOCOMPLETE_VALUES.EMAIL,
  "iconName='lock' (login)": AUTOCOMPLETE_VALUES.CURRENT_PASSWORD,
  "iconName='lock' (signup)": AUTOCOMPLETE_VALUES.NEW_PASSWORD,
  "iconName='place' (endereco)": AUTOCOMPLETE_VALUES.STREET_ADDRESS,
  "iconName='place' (bairro)": AUTOCOMPLETE_VALUES.ADDRESS_LEVEL2,
  "iconName='place' (cep)": AUTOCOMPLETE_VALUES.POSTAL_CODE,
  "iconName='build'": AUTOCOMPLETE_VALUES.ORGANIZATION,
  "iconName='contact' (cpf/cnpj)": AUTOCOMPLETE_VALUES.OFF,
  "iconName='phone'": AUTOCOMPLETE_VALUES.PHONE,
} as const
