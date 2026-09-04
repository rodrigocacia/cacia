export type Plan = {
  id: number
  value: number
  title: string
  benefits: (
    | {
        id: number
        title: string
      }
    | {
        id: number
        title: string
      }
  )[]
  mostPopular: boolean
}

export const plans: Plan[] = [
  {
    id: 0,
    value: 129,
    title: "",
    benefits: [
      { id: 0, title: "Desconto vitalício após o Beta" },
      { id: 1, title: "Canal direto com o time" },
      { id: 3, title: "Grupo exclusivo Beta" },
      { id: 4, title: "Visibilidade como co-criador" },
      { id: 5, title: "Nome no Hall oficial" },
      { id: 6, title: "Acesso antecipado a novas funções" },
      { id: 7, title: "Preferência em integrações e recursos" },
    ],
    mostPopular: false,
  },
]
