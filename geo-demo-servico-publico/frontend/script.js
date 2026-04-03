const API_BASE = '/api';

const loadGeoBtn = document.getElementById('loadGeoBtn');
const geoStatus = document.getElementById('geoStatus');
const cityInfo = document.getElementById('cityInfo');
const submitMessage = document.getElementById('submitMessage');
const occurrenceJson = document.getElementById('occurrenceJson');
const emailPreview = document.getElementById('emailPreview');
const occurrenceForm = document.getElementById('occurrenceForm');

let map;
let marker;
let rectangle;
let cityGeo = null;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function initMap() {
  map = L.map('map').setView([-21.7033330, -44.4438890], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
}

function setStatus(node, message, tone) {
  node.textContent = message;
  node.className = `status ${tone || ''}`;
}

function updateFormGeoFields(geo) {
  document.getElementById('latitude').value = geo.lat;
  document.getElementById('longitude').value = geo.lon;
  document.getElementById('cidade').value = geo.nome;
  document.getElementById('uf').value = geo.uf;
  document.getElementById('ibge_id').value = geo.ibge_id;
}

function updateMap(geo) {
  map.setView([geo.lat, geo.lon], 13);

  if (marker) map.removeLayer(marker);
  marker = L.marker([geo.lat, geo.lon])
    .addTo(map)
    .bindPopup(`<strong>${escapeHtml(geo.nome)}/${escapeHtml(geo.uf)}</strong><br/>${escapeHtml(geo.display_name)}`)
    .openPopup();

  if (rectangle) map.removeLayer(rectangle);
  const [south, north, west, east] = geo.bounding_box;
  rectangle = L.rectangle([[south, west], [north, east]], {
    color: '#0b5cad',
    weight: 2,
    fillOpacity: 0.08
  }).addTo(map);

  map.fitBounds(rectangle.getBounds(), { padding: [20, 20] });
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() };

  if (!response.ok) {
    throw new Error(data.message || 'Falha de comunicação com a API.');
  }
  return data;
}

async function loadGeoData() {
  setStatus(geoStatus, 'Carregando geolocalização oficial...', '');

  try {
    const data = await requestJson(`${API_BASE}/geo/sao-vicente-de-minas`);
    cityGeo = data;

    cityInfo.textContent = JSON.stringify(data, null, 2);
    updateFormGeoFields(data);
    updateMap(data);

    const sourceText = data.source === 'api' ? 'APIs oficiais (IBGE + Nominatim)' : 'Fallback de contingência';
    setStatus(geoStatus, `Geolocalização carregada com sucesso. Fonte: ${sourceText}.`, 'success');
  } catch (error) {
    setStatus(geoStatus, error.message, 'error');
  }
}

function extractFormPayload() {
  return {
    nomeCidadao: document.getElementById('nomeCidadao').value.trim(),
    tipoOcorrencia: document.getElementById('tipoOcorrencia').value,
    descricao: document.getElementById('descricao').value.trim(),
    pontoReferencia: document.getElementById('pontoReferencia').value.trim(),
    destinatario: document.getElementById('destinatario').value,
    emailDestino: document.getElementById('emailDestino').value.trim(),
    latitude: Number(document.getElementById('latitude').value),
    longitude: Number(document.getElementById('longitude').value),
    cidade: document.getElementById('cidade').value.trim(),
    uf: document.getElementById('uf').value.trim(),
    ibge_id: Number(document.getElementById('ibge_id').value)
  };
}

async function onSubmitOccurrence(event) {
  event.preventDefault();

  if (!cityGeo) {
    setStatus(submitMessage, 'Carregue a geolocalização oficial antes de registrar.', 'error');
    return;
  }

  const payload = extractFormPayload();

  try {
    const result = await requestJson(`${API_BASE}/ocorrencias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    occurrenceJson.textContent = JSON.stringify(result.occurrence, null, 2);
    emailPreview.textContent = `Assunto: ${result.emailPreview.assunto}\nPara: ${result.emailPreview.destinatario}\n\n${result.emailPreview.corpo}`;

    setStatus(submitMessage, 'Ocorrência registrada com sucesso e pronta para encaminhamento institucional.', 'success');
  } catch (error) {
    setStatus(submitMessage, error.message, 'error');
  }
}

loadGeoBtn.addEventListener('click', loadGeoData);
occurrenceForm.addEventListener('submit', onSubmitOccurrence);

initMap();
