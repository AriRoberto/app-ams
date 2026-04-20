export function humanizeType(type) {
  return type
    .toLowerCase()
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

export function buildInstitutionalEmailPreview(occurrence) {
  const assunto = `Nova ocorrência urbana - ${humanizeType(occurrence.tipoOcorrencia)} - ${occurrence.cidade}/${occurrence.uf}`;
  const requirementLines = occurrence.requirementFormEnabled
    ? [
        '',
        'Requerimento à Prefeitura: habilitado',
        `Assunto do requerimento: ${occurrence.requirementFormData?.assunto || 'Não informado'}`,
        `Texto base do requerimento: ${occurrence.requirementFormData?.texto || 'Não informado'}`
      ]
    : [
        '',
        'Requerimento à Prefeitura: não habilitado'
      ];

  const corpo = [
    'Prezados(as),',
    '',
    'Encaminho para análise e providências a ocorrência urbana abaixo:',
    '',
    `Nome do cidadão: ${occurrence.nomeCidadao}`,
    `Tipo da ocorrência: ${humanizeType(occurrence.tipoOcorrencia)}`,
    `Descrição: ${occurrence.descricao}`,
    `Ponto de referência: ${occurrence.pontoReferencia}`,
    `Cidade: ${occurrence.cidade}`,
    `UF: ${occurrence.uf}`,
    `Código IBGE: ${occurrence.ibge_id}`,
    `Latitude: ${occurrence.latitude}`,
    `Longitude: ${occurrence.longitude}`,
    `Data/hora do registro: ${occurrence.dataHoraRegistro}`,
    ...requirementLines,
    '',
    'Solicito o devido encaminhamento institucional e retorno sobre as providências adotadas.',
    '',
    'Atenciosamente,',
    occurrence.nomeCidadao
  ].join('\n');

  return {
    assunto,
    destinatario: occurrence.emailDestino,
    corpo
  };
}
