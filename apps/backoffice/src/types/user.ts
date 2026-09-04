export interface User {
  _id: string;
  name: string;
  email: string;
  document: string;
  birthday: string;
  phone: string;
  avatar: string;
  thumb: string;
  country: string;
  state: string;
  city: string;
  role: string;
  verified: boolean;
  forgot_code: string;
  forgot_code_expires_at: string;
  offices: string[];
  favorites: string[];
  signatures: string[];
  password: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  __v: number;
}
