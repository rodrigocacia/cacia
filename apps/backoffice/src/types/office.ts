import { Address } from './address';

export interface Office {
  _id: string;
  name: string;
  document: string;
  legal_name: string;
  trade_name: string;
  remotejid: string;
  description: string;
  oab_number: string;
  oab_uf: string;
  addresses?: Address[];
  created_at: string;
  /** Situação do escritório — é o que a API devolve e filtra. */
  status: OfficeStatus;
}

export enum OfficeStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  DEACTIVATE = 'DEACTIVATE',
}

export enum OfficeSignatureStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
}
