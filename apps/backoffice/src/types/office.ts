import { Address } from './address';

export interface Office {
  _id: string;
  name: string;
  document: string;
  legal_name: string;
  trade_name: string;
  remotejid: string;
  description: string;
  address: Address[];
  plan: string;
  created_at: string;
  updated_at: string;
  status: OfficeStatus;
  signature_status: OfficeSignatureStatus;
}

export enum OfficeStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  DEACTIVATE = 'deactivate',
}

export enum OfficeSignatureStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
}
