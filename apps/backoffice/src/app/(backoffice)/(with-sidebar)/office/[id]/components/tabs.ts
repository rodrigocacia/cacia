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
  ];
}
