import { apiCrm } from "../api-crm"

/** Como `GET /offices/current/members` devolve: o usuário achatado, com o papel. */
export interface Membro {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
  memberSince: string
}

/**
 * Membros do escritório — quem pode ser responsável por um lead.
 *
 * A API amarra o responsável a um membro pela chave estrangeira composta com
 * o escritório: oferecer aqui alguém de fora resultaria num 404 depois de a
 * pessoa já ter escolhido.
 */
export function listarMembros(): Promise<Membro[]> {
  return apiCrm.get("offices/current/members").json<Membro[]>()
}

export interface AgendaDoEscritorio {
  id: string
  title: string
  status: boolean
}

export function listarAgendas(): Promise<AgendaDoEscritorio[]> {
  return apiCrm.get("calendars").json<AgendaDoEscritorio[]>()
}
