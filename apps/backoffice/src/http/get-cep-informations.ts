/* eslint-disable @typescript-eslint/no-explicit-any */
import ky from 'ky';

export async function getCepInformations(cep: string) {
  const result = await ky
    .get(`https://viacep.com.br/ws/${cep}/json`)
    .json<any>();

  return result;
}
