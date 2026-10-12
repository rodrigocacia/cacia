export function navLinks(processId: string) {
  return [
    {
      id: 1,
      name: "Informações",
      path: `/process/${processId}/information`,
    },
    {
      id: 2,
      name: "Andamentos",
      path: `/process/${processId}/progress`,
    },
    {
      id: 3,
      name: "Eventos",
      path: `/process/${processId}/events`,
    },
    {
      id: 4,
      name: "Documentos",
      path: `/process/${processId}/document`,
    },
  ]
}
