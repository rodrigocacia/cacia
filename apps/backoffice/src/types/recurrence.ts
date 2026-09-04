export interface Recurrence {
  _id: string;
  office: {
    _id: string;
    name: string;
    document: string;
  };
  user: {
    _id: string;
    name: string;
    email: string;
  };
  plan: {
    _id: string;
    title: string;
    description: string;
    price: number;
  };
  signature: {
    _id: string;
    type: string;
    status: string;
  };
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export enum RecurrenceStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}
