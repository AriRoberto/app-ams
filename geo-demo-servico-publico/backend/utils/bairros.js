export const BAIRROS_SAO_VICENTE = ['Centro', 'Cidade Nova', 'Vila Nova'];

export function isBairroValido(bairro) {
  return BAIRROS_SAO_VICENTE.includes(bairro);
}
