const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3340/api';

async function request(path, options) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Falha na API');
  return data;
}

export function fetchGeoData() {
  return request('/geo/sao-vicente-de-minas');
}

export function sendOccurrence(payload) {
  return request('/ocorrencias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
