import { cookies } from 'next/headers';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userData = cookieStore.get('userData')?.value;

  if (!userData) return null;

  return JSON.parse(userData);
}

export async function getCurrentOfficeId() {
  const cookieStore = await cookies();
  const officeId = cookieStore.get('_id')?.value;

  return officeId ?? null;
}

export async function isAuthenticated() {
  const cookieStore = await cookies();
  return !!cookieStore.get('token:backoffice')?.value;
}
