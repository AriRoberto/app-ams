export function normalizeCpf(value = '') {
  return String(value).replace(/\D/g, '');
}

export function isValidCpf(value = '') {
  const cpf = normalizeCpf(value);
  if (!/^[0-9]{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split('').map(Number);
  const calculateDigit = (slice) => {
    const factor = slice.length + 1;
    const sum = slice.reduce((total, num, index) => total + num * (factor - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return calculateDigit(digits.slice(0, 9)) === digits[9] && calculateDigit(digits.slice(0, 10)) === digits[10];
}
