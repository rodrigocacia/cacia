import { Process } from './process';

export enum EventType {
  MEETING = 'MEETING',
  HEARING = 'HEARING',
  INQUIRY = 'INQUIRY',
  DEADLINE = 'DEADLINE',
}

export enum EventStatus {
  PENDING = 'PENDING',
  CONFIRM = 'CONFIRM',
}

export interface Event {
  _id: string;
  office: string;
  lead: {
    _id: string;
    name: string;
  };
  customer: {
    _id: string;
    name: string;
  };
  calendar: {
    _id: string;
    title: string;
  };
  type: EventType;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: string;
  process?: Process;
  deleted_at: null;
  created_at: string;
  updated_at: string;
  __v: number;
}
