export const CITY_FALLBACK = {
  ibge_id: 3165305,
  nome: 'São Vicente de Minas',
  uf: 'MG',
  lat: -21.7033330,
  lon: -44.4438890,
  bounding_box: [-21.8000000, -21.5176014, -44.5851375, -44.3424830],
  display_name: 'São Vicente de Minas, Minas Gerais, Brasil'
};

export const OCCURRENCE_TYPES = [
  'LAMPADA_QUEIMADA',
  'BURACO_NA_RUA',
  'MATO_ALTO',
  'ENTULHO',
  'VAZAMENTO',
  'PROBLEMA_ESCOLA',
  'PROBLEMA_POSTO_SAUDE',
  'PROBLEMA_PRACA',
  'OUTRO'
];

export const OCCURRENCE_STATUS = [
  'ABERTA',
  'EM_ANALISE',
  'EM_ATENDIMENTO',
  'ENCAMINHADO_EXECUTIVO',
  'CONCLUIDA'
];

export const EXECUTIVE_RESPONSE_STATUS = [
  'DEFERIDO',
  'INDEFERIDO'
];

export const DESTINATARIOS = [
  'PREFEITURA',
  'SECRETARIA_MUNICIPAL',
  'OUVIDORIA',
  'VEREADOR',
  'OUTRO_REPRESENTANTE'
];
