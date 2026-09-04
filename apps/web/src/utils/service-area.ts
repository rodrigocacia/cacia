export const serviceArea: Record<string, string> = {
  administrative: "Administrativo",
  agrarian: "Agrário",
  bankruptcy: "Falência",
  business: "Empresarial",
  civil: "Cível",
  consumer: "Consumidor",
  contract: "Contratos",
  corporate: "Corporativo",
  criminal: "Criminal",
  digital: "Digital",
  electoral: "Eleitoral",
  environmental: "Ambiental",
  family: "Família",
  health: "Saúde",
  human_rights: "Direitos Humanos",
  immigration: "Imigração",
  intellectual_property: "Propriedade Intelectual",
  international: "Internacional",
  labor: "Trabalhista",
  military: "Militar",
  notarial: "Notarial",
  real_estate: "Imobiliário",
  tax: "Tributário",
  other: "Outro",
}

export function translateServiceArea(value: string): string {
  return serviceArea[value] ?? "Desconhecido"
}
