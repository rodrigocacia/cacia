import ky from 'ky';
import { deleteCookie } from 'cookies-next';
import { redirect } from 'next/navigation';

export const api = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  hooks: {
    beforeRequest: [
      async (request) => {
        let token: string | undefined;

        if (typeof window === 'undefined') {
          const { cookies } = await import('next/headers');
          token = (await cookies()).get('token:backoffice')?.value;
        } else {
          const { getCookie } = await import('cookies-next');
          token = getCookie('token:backoffice') as string | undefined;
        }

        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
        // A API nova resolve o escritório por este cabeçalho — nunca por query
        // ou corpo — e recusa a requisição sem ele nas rotas de escritório.
        let officeId: string | undefined;

        if (typeof window === 'undefined') {
          const { cookies } = await import('next/headers');
          officeId = (await cookies()).get('office_id')?.value;
        } else {
          const { getCookie } = await import('cookies-next');
          officeId = getCookie('office_id') as string | undefined;
        }

        if (officeId) {
          request.headers.set('x-office-id', officeId);
        }
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            deleteCookie('token:backoffice');
            window.location.href = '/signin';
          } else {
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            cookieStore.delete('token:backoffice');
            redirect('/signin');
          }
        }
      },
    ],
  },
});
