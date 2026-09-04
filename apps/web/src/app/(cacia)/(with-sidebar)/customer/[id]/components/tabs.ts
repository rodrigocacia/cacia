export function tabs(customerId: string) {
  return [
    {
      id: 1,
      name: "Informações pessoais",
      path: `/customer/${customerId}/personal-information`,
    },
    { id: 2, name: "Processos", path: `/customer/${customerId}/process` },
    { id: 4, name: "Eventos", path: `/customer/${customerId}/events` },
    { id: 3, name: "Documentos", path: `/customer/${customerId}/document` },
  ]
}
