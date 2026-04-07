export function formatOccurrenceRow(row) {
  return {
    ...row,
    bairro: row.bairro || 'Não informado'
  };
}
