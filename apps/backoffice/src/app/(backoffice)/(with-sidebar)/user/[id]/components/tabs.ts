export function tabs(userId: string) {
  return [
    {
      id: 1,
      name: 'Informações pessoais',
      path: `/user/${userId}/personal-information`,
    },
    {
      id: 2,
      name: 'Escritórios',
      path: `/user/${userId}/offices`,
    },
  ];
}
