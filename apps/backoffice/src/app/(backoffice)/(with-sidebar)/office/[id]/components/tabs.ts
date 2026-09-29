export function tabs(officeId: string) {
  return [
    {
      id: 1,
      name: 'Informações',
      path: `/office/${officeId}/information`,
    },
    {
      id: 2,
      name: 'Performance',
      path: `/office/${officeId}/performance`,
    },
    {
      id: 3,
      name: 'Consumo de IA',
      path: `/office/${officeId}/ai-usage`,
    },
  ];
}
