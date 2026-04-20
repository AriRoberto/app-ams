const API_BASE = '/api';
const AUTH_MODE = {
  login: 'login',
  signup: 'signup'
};

const AUTH_KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  user: 'auth_user'
};

const loadGeoBtn = document.getElementById('loadGeoBtn');
const geoStatus = document.getElementById('geoStatus');
const submitMessage = document.getElementById('submitMessage');
const occurrenceJson = document.getElementById('occurrenceJson');
const occurrenceDetailJson = document.getElementById('occurrenceDetailJson');
const emailPreview = document.getElementById('emailPreview');
const occurrenceForm = document.getElementById('occurrenceForm');
const submitOccurrenceBtn = document.getElementById('submitOccurrenceBtn');
const loadOccurrencesBtn = document.getElementById('loadOccurrencesBtn');
const occurrenceTableBody = document.querySelector('#occurrenceTable tbody');
const bairroSelect = document.getElementById('bairro');
const filterBairro = document.getElementById('filterBairro');
const enableRequirementForm = document.getElementById('enableRequirementForm');
const requirementFormSection = document.getElementById('requirementFormSection');
const requirementSubject = document.getElementById('requirementSubject');
const requirementText = document.getElementById('requirementText');

const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authInfo = document.getElementById('authInfo');
const authMessage = document.getElementById('authMessage');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const authLoginModeBtn = document.getElementById('authLoginModeBtn');
const authSignupModeBtn = document.getElementById('authSignupModeBtn');
const signupFields = document.getElementById('signupFields');
const signupName = document.getElementById('signupName');
const signupCpf = document.getElementById('signupCpf');
const quickAdminBtn = document.getElementById('quickAdminBtn');
const logoutBtn = document.getElementById('logoutBtn');

let map;
let marker;
let rectangle;
let cityGeo = null;
let authMode = AUTH_MODE.login;
let allowedBairros = [];
let currentOccurrences = [];

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function setStatus(node, message, tone) {
  node.textContent = message;
  node.className = `status ${tone || ''}`;
}

function getAccessToken() {
  return localStorage.getItem(AUTH_KEYS.accessToken) || '';
}

function getRefreshToken() {
  return localStorage.getItem(AUTH_KEYS.refreshToken) || '';
}

function getAuthUser() {
  const raw = localStorage.getItem(AUTH_KEYS.user);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setAuthSession(data) {
  localStorage.setItem(AUTH_KEYS.accessToken, data.accessToken || '');
  localStorage.setItem(AUTH_KEYS.refreshToken, data.refreshToken || '');

  if (data.user) {
    localStorage.setItem(AUTH_KEYS.user, JSON.stringify(data.user));
  }
}

function clearAuthSession() {
  localStorage.removeItem(AUTH_KEYS.accessToken);
  localStorage.removeItem(AUTH_KEYS.refreshToken);
  localStorage.removeItem(AUTH_KEYS.user);
}

function isAuthenticated() {
  return Boolean(getAccessToken());
}

function updateAuthUI() {
  const user = getAuthUser();
  const authenticated = isAuthenticated() && user;

  if (authenticated) {
    authInfo.textContent = `Logado como ${user.nome} (${user.role}) — ${user.email}`;
    authInfo.className = 'auth-info auth-on';
    submitOccurrenceBtn.disabled = false;
    return;
  }

  authInfo.textContent = 'Status: deslogado';
  authInfo.className = 'auth-info auth-off';
  submitOccurrenceBtn.disabled = true;
}

function initMap() {
  map = L.map('map').setView([-21.7033330, -44.4438890], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
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

function updateAuthModeUI() {
  const signup = authMode === AUTH_MODE.signup;
  signupFields.hidden = !signup;
  signupBtn.hidden = !signup;
  loginBtn.hidden = signup;
  quickAdminBtn.hidden = signup;
  authLoginModeBtn.classList.toggle('active', !signup);
  authSignupModeBtn.classList.toggle('active', signup);
}

function setAuthMode(mode) {
  authMode = mode;
  updateAuthModeUI();
  setStatus(authMessage, '', '');
}

function buildBairroOptions() {
  bairroSelect.innerHTML = '<option value="" selected disabled>Selecione um bairro</option>';
  filterBairro.innerHTML = '<option value="">Todos</option>';

  allowedBairros.forEach((bairro) => {
    const optionForm = document.createElement('option');
    optionForm.value = bairro;
    optionForm.textContent = bairro;
    bairroSelect.appendChild(optionForm);

    const optionFilter = document.createElement('option');
    optionFilter.value = bairro;
    optionFilter.textContent = bairro;
    filterBairro.appendChild(optionFilter);
  });
}

function updateRequirementFormState() {
  const enabled = enableRequirementForm.checked;
  requirementFormSection.disabled = !enabled;
  requirementSubject.required = enabled;
  requirementText.required = enabled;
}

function getOccurrenceSummary(item) {
  const requester = item.nomeCidadao || getAuthUser()?.nome || 'Solicitante';
  const protocol = item.id ? `Protocolo ${item.id.slice(0, 8).toUpperCase()}` : 'Protocolo pendente';
  return `
    <div class="occurrence-cell">
      <strong>${escapeHtml(requester)}</strong>
      <span>${escapeHtml(protocol)}</span>
    </div>
  `;
}

function renderOccurrenceTable(rows) {
  if (!rows.length) {
    occurrenceTableBody.innerHTML = '<tr><td colspan="6">Nenhuma ocorrência encontrada.</td></tr>';
    return;
  }

  occurrenceTableBody.innerHTML = rows.map((item) => `
    <tr>
      <td>${getOccurrenceSummary(item)}</td>
      <td>${escapeHtml(item.bairro || 'Não informado')}</td>
      <td>${escapeHtml(item.tipoOcorrencia)}</td>
      <td>${escapeHtml(item.status)}</td>
      <td>${new Date(item.dataHoraRegistro).toLocaleString('pt-BR')}</td>
      <td><button data-id="${item.id}" class="detailBtn" type="button">Ver</button></td>
    </tr>
  `).join('');
}

async function parseApiResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return { message: await response.text() };
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  const data = await parseApiResponse(response);
  if (!response.ok) return false;

  setAuthSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: getAuthUser() });
  return true;
}

async function authFetch(url, options = {}, attemptRefresh = true) {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const accessToken = getAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && attemptRefresh) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      const retriedHeaders = new Headers(options.headers || {});
      retriedHeaders.set('Authorization', `Bearer ${getAccessToken()}`);
      if (!retriedHeaders.has('Content-Type') && options.body && typeof options.body === 'string') {
        retriedHeaders.set('Content-Type', 'application/json');
      }
      response = await fetch(url, { ...options, headers: retriedHeaders });
    } else {
      clearAuthSession();
      updateAuthUI();
      throw new Error('Sua sessão expirou. Faça login novamente.');
    }
  }

  const data = await parseApiResponse(response);

  if (!response.ok) {
    throw new Error(data.message || 'Falha de comunicação com a API.');
  }

  return data;
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const data = await parseApiResponse(response);

  if (!response.ok) {
    throw new Error(data.message || 'Falha de comunicação com a API.');
  }

  return data;
}

async function loadBairros() {
  try {
    const response = await requestJson(`${API_BASE}/bairros`);
    allowedBairros = response.data || [];
    buildBairroOptions();
  } catch (error) {
    setStatus(submitMessage, `Falha ao carregar bairros: ${error.message}`, 'error');
  }
}

async function loadGeoData() {
  setStatus(geoStatus, 'Carregando geolocalização oficial...', '');

  try {
    const data = await requestJson(`${API_BASE}/geo/sao-vicente-de-minas`);
    cityGeo = data;

    updateMap(data);

    const sourceText = data.source === 'api' ? 'APIs oficiais (IBGE + Nominatim)' : 'Fallback de contingência';
    setStatus(geoStatus, `Geolocalização carregada com sucesso. Fonte: ${sourceText}.`, 'success');
  } catch (error) {
    setStatus(geoStatus, error.message, 'error');
  }
}

function extractFormPayload() {
  const requirementFormEnabled = enableRequirementForm.checked;
  return {
    nomeCidadao: document.getElementById('nomeCidadao').value.trim(),
    tipoOcorrencia: document.getElementById('tipoOcorrencia').value,
    bairro: document.getElementById('bairro').value,
    descricao: document.getElementById('descricao').value.trim(),
    pontoReferencia: document.getElementById('pontoReferencia').value.trim(),
    destinatario: document.getElementById('destinatario').value,
    emailDestino: document.getElementById('emailDestino').value.trim(),
    latitude: Number(cityGeo.lat),
    longitude: Number(cityGeo.lon),
    cidade: cityGeo.nome,
    uf: cityGeo.uf,
    ibge_id: Number(cityGeo.ibge_id),
    requirementFormEnabled,
    requirementFormData: requirementFormEnabled
      ? {
          assunto: requirementSubject.value.trim(),
          texto: requirementText.value.trim()
        }
      : null
  };
}

async function onSignup() {
  try {
    const nome = signupName.value.trim();
    const cpf = signupCpf.value.trim();
    const email = authEmail.value.trim().toLowerCase();
    const password = authPassword.value;

    if (!nome || !cpf || !email || !password) {
      setStatus(authMessage, 'Informe nome, CPF, e-mail e senha para cadastrar.', 'error');
      return;
    }

    const data = await requestJson(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, cpf, email, password, role: 'cidadao' })
    });

    const tokenMessage = data.verificationToken
      ? ` Token local: ${data.verificationToken}`
      : '';
    setAuthMode(AUTH_MODE.login);
    setStatus(authMessage, `${data.message || 'Cadastro realizado.'}${tokenMessage}`, 'success');
  } catch (error) {
    setStatus(authMessage, error.message || 'Não foi possível cadastrar.', 'error');
  }
}

async function loadOccurrences() {
  if (!isAuthenticated()) {
    occurrenceTableBody.innerHTML = '<tr><td colspan="6">Faça login para visualizar ocorrências.</td></tr>';
    return;
  }

  const response = await authFetch(`${API_BASE}/ocorrencias`);
  const selectedBairro = filterBairro.value;
  currentOccurrences = response.data || [];

  const filtered = selectedBairro
    ? currentOccurrences.filter((item) => item.bairro === selectedBairro)
    : currentOccurrences;

  renderOccurrenceTable(filtered);
}

async function loadOccurrenceDetail(id) {
  try {
    const response = await authFetch(`${API_BASE}/ocorrencias/${id}`);
    occurrenceDetailJson.textContent = JSON.stringify(response.data, null, 2);
  } catch (error) {
    occurrenceDetailJson.textContent = `Erro ao carregar detalhe: ${error.message}`;
  }
}

async function loginWithCredentials(email, password) {
  const data = await requestJson(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  setAuthSession(data);
  updateAuthUI();
  setStatus(authMessage, 'Login realizado com sucesso.', 'success');
  await loadOccurrences();
}

async function onLogin() {
  try {
    const email = authEmail.value.trim().toLowerCase();
    const password = authPassword.value;

    if (!email || !password) {
      setStatus(authMessage, 'Informe e-mail e senha para entrar.', 'error');
      return;
    }

    await loginWithCredentials(email, password);
  } catch (error) {
    setStatus(authMessage, error.message || 'Não foi possível autenticar.', 'error');
  }
}

async function onQuickAdminLogin() {
  authEmail.value = 'admin@demo.local';
  authPassword.value = 'Admin@123';
  await onLogin();
}

async function onLogout() {
  const refreshToken = getRefreshToken();

  try {
    if (refreshToken) {
      await requestJson(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
    }
  } catch {
    // limpeza local é obrigatória mesmo com falha da API
  } finally {
    clearAuthSession();
    updateAuthUI();
    occurrenceTableBody.innerHTML = '<tr><td colspan="6">Faça login para visualizar ocorrências.</td></tr>';
    occurrenceDetailJson.textContent = 'Selecione uma ocorrência na tabela para visualizar detalhes.';
    setStatus(authMessage, 'Logout realizado. Faça login para registrar novas ocorrências.', 'success');
  }
}

async function onSubmitOccurrence(event) {
  event.preventDefault();

  if (!isAuthenticated()) {
    setStatus(submitMessage, 'Faça login antes de registrar a ocorrência.', 'error');
    setStatus(authMessage, 'Você está deslogado. Entre novamente.', 'error');
    return;
  }

  if (!cityGeo) {
    setStatus(submitMessage, 'Carregue a geolocalização oficial antes de registrar.', 'error');
    return;
  }

  if (!bairroSelect.value) {
    setStatus(submitMessage, 'Selecione um bairro antes de enviar.', 'error');
    return;
  }

  const payload = extractFormPayload();

  try {
    const result = await authFetch(`${API_BASE}/ocorrencias`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    occurrenceJson.textContent = JSON.stringify(result.occurrence, null, 2);
    occurrenceDetailJson.textContent = JSON.stringify(result.occurrence, null, 2);
    emailPreview.textContent = `Assunto: ${result.emailPreview.assunto}\nPara: ${result.emailPreview.destinatario}\n\n${result.emailPreview.corpo}`;

    setStatus(submitMessage, 'Ocorrência registrada com sucesso e pronta para encaminhamento institucional.', 'success');
    await loadOccurrences();
  } catch (error) {
    setStatus(submitMessage, error.message, 'error');
  }
}

loadGeoBtn.addEventListener('click', loadGeoData);
occurrenceForm.addEventListener('submit', onSubmitOccurrence);
loginBtn.addEventListener('click', onLogin);
signupBtn.addEventListener('click', onSignup);
authLoginModeBtn.addEventListener('click', () => setAuthMode(AUTH_MODE.login));
authSignupModeBtn.addEventListener('click', () => setAuthMode(AUTH_MODE.signup));
quickAdminBtn.addEventListener('click', onQuickAdminLogin);
logoutBtn.addEventListener('click', onLogout);
loadOccurrencesBtn.addEventListener('click', loadOccurrences);
filterBairro.addEventListener('change', loadOccurrences);
enableRequirementForm.addEventListener('change', updateRequirementFormState);
occurrenceTableBody.addEventListener('click', (event) => {
  const button = event.target.closest('.detailBtn');
  if (!button) return;
  loadOccurrenceDetail(button.dataset.id);
});

updateAuthUI();
updateAuthModeUI();
updateRequirementFormState();
initMap();
loadBairros();
