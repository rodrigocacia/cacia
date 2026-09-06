import { Address } from './address';

/** Escritório de que o usuário participa, com o papel dele lá dentro. */
export interface UserOffice {
  _id: string;
  id: string;
  name: string;
  status: string;
  role: string;
  /**
   * Só no detalhe do usuário.
   *
   * A listagem não carrega o endereço: a coluna de lá mostra a quantidade, e
   * trazer o endereço de cada escritório de vinte usuários por página seria
   * pagar por dado que ninguém olha.
   */
  addresses?: Address[];
}

export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  document: string | null;
  birthday: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
  verified: boolean;
  offices: UserOffice[];
  created_at: string;
}
