export function phone(e: React.FormEvent<HTMLInputElement>) {
  e.currentTarget.maxLength = 15;
  let value = e.currentTarget.value;
  value = value.replace(/\D/g, '');
  value = value.replace(/(\d{2})(\d)/, '($1) $2');
  value = value.replace(/(\d{4})(\d)/, '$1-$2');
  value = value.replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3');
  value = value.replace(/(-\d{4})\d+?$/, '$1');

  e.currentTarget.value = value;
  return e;
}

export function cpfCnpj(e: React.FormEvent<HTMLInputElement>) {
  let value = e.currentTarget.value;
  value = value.replace(/\D/g, '');

  // O limite é sempre o do CNPJ formatado. Limitar a 14 enquanto o valor tem
  // cara de CPF travava o campo em "000.000.000-00" — o 12º dígito nunca
  // entrava, e CNPJ era impossível de digitar.
  e.currentTarget.maxLength = 18;

  if (value.length <= 11) {
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{2})$/, '$1-$2');
  } else {
    value = value.replace(/(\d{2})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');
    value = value.replace(/(-\d{2})\d+?$/, '$1');
  }

  e.currentTarget.value = value;
  return e;
}

export function cep(e: React.FormEvent<HTMLInputElement>) {
  e.currentTarget.maxLength = 9;
  let value = e.currentTarget.value;
  value = value.replace(/\D/g, '');
  value = value.replace(/^(\d{5})(\d)/, '$1-$2');
  e.currentTarget.value = value;
  return e;
}

export function cpf(e: React.FormEvent<HTMLInputElement>) {
  e.currentTarget.maxLength = 14;
  let value = e.currentTarget.value;
  if (!value.match(/^(\d{3}).(\d{3}).(\d{3})-(\d{2})$/)) {
    value = value.replace(/\D/g, '');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{2})$/, '$1-$2');
    e.currentTarget.value = value;
  }
  return e;
}

export function cnpj(e: React.FormEvent<HTMLInputElement>) {
  e.currentTarget.maxLength = 18;
  let value = e.currentTarget.value;
  value = value.replace(/\D+/g, '');
  value = value.replace(/(\d{2})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d)/, '$1/$2');
  value = value.replace(/(\d{4})(\d)/, '$1-$2');
  value = value.replace(/(-\d{2})\d+?$/, '$1');

  e.currentTarget.value = value;

  return e;
}

export function date(e: React.FormEvent<HTMLInputElement>) {
  e.currentTarget.maxLength = 10;
  let value = e.currentTarget.value;
  value = value.replace(/\D+/g, '');
  value = value.replace(/(\d{2})(\d)/, '$1/$2');
  value = value.replace(/(\/\d{2})(\d)/, '$1/$2');
  value = value.replace(/(\/\d{4})\d+?$/, '$1');
  e.currentTarget.value = value;
  return e;
}

export function hour(e: React.FormEvent<HTMLInputElement>) {
  e.currentTarget.maxLength = 5;
  let value = e.currentTarget.value;
  value = value.replace(/\D/g, '');
  value = value.replace(/^(\d{2})(\d)/, '$1:$2');
  e.currentTarget.value = value;
  return e;
}

export function currency(e: React.FormEvent<HTMLInputElement>) {
  let value = e.currentTarget.value;
  value = value.replace(/\D/g, '');
  value = value.replace(/(\d)(\d{2})$/, '$1,$2');
  value = value.replace(/(?=(\d{3})+(\D))\B/g, '.');

  e.currentTarget.value = value;
  return e;
}
