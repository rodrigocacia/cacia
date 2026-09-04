export function formatDocument(document: string): string {
  if (!document) return '';

  const cleaned = document.replace(/\D/g, '');

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  if (cleaned.length === 14) {
    return cleaned.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5',
    );
  }

  return document;
}

export function formatPhone(phone: string): string {
  if (!phone) return '';

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 13) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4');
  }

  if (cleaned.length === 12) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, '+$1 ($2) $3-$4');
  }

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  return phone;
}

export function getDocumentType(document: string): 'CPF' | 'CNPJ' {
  if (!document) return 'CPF';

  const cleaned = document.replace(/\D/g, '');
  return cleaned.length === 11 ? 'CPF' : 'CNPJ';
}

export function formatProcess(processNumber: string): string {
  if (!processNumber) return '';

  const cleaned = processNumber.replace(/\D/g, '');

  if (processNumber.includes('-') || processNumber.includes('.')) {
    return processNumber;
  }

  let formatted = cleaned;

  if (cleaned.length >= 9) {
    formatted = formatted.replace(/^(\d{7})(\d{2})/, '$1-$2');
  }

  if (cleaned.length >= 13) {
    formatted = formatted.replace(/^(\d{7}-\d{2})(\d{4})/, '$1.$2');
  }

  if (cleaned.length >= 14) {
    formatted = formatted.replace(/^(\d{7}-\d{2}\.\d{4})(\d{1})/, '$1.$2');
  }

  if (cleaned.length >= 16) {
    formatted = formatted.replace(
      /^(\d{7}-\d{2}\.\d{4}\.\d{1})(\d{2})/,
      '$1.$2',
    );
  }

  if (cleaned.length >= 20) {
    formatted = formatted.replace(
      /^(\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2})(\d{4})/,
      '$1.$2',
    );
  }

  return formatted;
}

export function formatName(name: string): string {
  if (!name) return '';
  return name.toUpperCase();
}
