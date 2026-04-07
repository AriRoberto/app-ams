const API = '/api';
let accessToken = '';

function headers() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };
}

function qs() {
  const params = new URLSearchParams();
  ['bairro', 'categoria', 'status', 'dataInicio', 'dataFim'].forEach((id) => {
    const value = document.getElementById(id).value;
    if (value) params.set(id, value);
  });
  return params.toString();
}

function setDemoStatus(message, type = 'success') {
  const status = document.getElementById('demoStatus');
  status.textContent = message;
  status.className = `status ${type}`;
}

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) return alert(data.message || 'Falha login');
  if (!['admin', 'ouvidoria'].includes(data.user.role)) {
    return alert('Acesso permitido apenas para admin ou ouvidoria.');
  }

  accessToken = data.accessToken;
  setDemoStatus(`Sessão iniciada como ${data.user.role}.`);
  loadDashboard();
  return null;
}

function metricCard(title, value) {
  return `<div class="card"><strong>${title}</strong><p>${value}</p></div>`;
}

async function loadDashboard() {
  if (!accessToken) return;
  const query = qs();

  const [mRes, tRes] = await Promise.all([
    fetch(`${API}/admin/dashboard/metrics?${query}`, { headers: headers() }),
    fetch(`${API}/admin/dashboard/tickets?${query}`, { headers: headers() })
  ]);

  const metricsPayload = await mRes.json();
  const ticketsPayload = await tRes.json();

  if (!mRes.ok || !tRes.ok) {
    return alert(metricsPayload.message || ticketsPayload.message || 'Erro ao carregar painel');
  }

  const m = metricsPayload.data;
  document.getElementById('metrics').innerHTML = [
    metricCard('Volume', m.volumeTotal),
    metricCard('Tempo médio (h)', m.tempoMedioAtendimentoHoras),
    metricCard('Conformidade SLA (%)', m.conformidadeSla),
    metricCard('Total atenção', m.totalAtencao),
    metricCard('Total violado', m.totalViolado)
  ].join('');

  const tbody = document.querySelector('#ticketsTable tbody');
  tbody.innerHTML = ticketsPayload.data.map((ticket) => `
    <tr>
      <td>${ticket.id}</td>
      <td>${ticket.bairro || '-'}</td>
      <td>${ticket.categoria}</td>
      <td>${ticket.status}</td>
      <td class="sla-${ticket.sla_status}">${ticket.sla_status}</td>
      <td>${ticket.tempo_restante}</td>
      <td>
        <select data-id="${ticket.id}">
          <option ${ticket.status === 'ABERTA' ? 'selected' : ''}>ABERTA</option>
          <option ${ticket.status === 'EM_ANALISE' ? 'selected' : ''}>EM_ANALISE</option>
          <option ${ticket.status === 'EM_ATENDIMENTO' ? 'selected' : ''}>EM_ATENDIMENTO</option>
          <option ${ticket.status === 'CONCLUIDA' ? 'selected' : ''}>CONCLUIDA</option>
        </select>
        <button onclick="updateStatus('${ticket.id}')">Salvar</button>
      </td>
    </tr>
  `).join('');
}

async function updateStatus(id) {
  const select = document.querySelector(`select[data-id='${id}']`);
  const status = select.value;
  const res = await fetch(`${API}/admin/tickets/${id}/status`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ status })
  });
  const payload = await res.json();
  if (!res.ok) return alert(payload.message || 'Falha ao atualizar status');
  loadDashboard();
  return null;
}

async function seedDemoData() {
  if (!accessToken) return alert('Faça login primeiro.');
  const total = Number(document.getElementById('demoTotal').value || 24);

  const res = await fetch(`${API}/admin/demo-data/seed`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ total })
  });

  const payload = await res.json();
  if (!res.ok) {
    setDemoStatus(payload.message || 'Falha ao criar massa demo.', 'error');
    return;
  }

  setDemoStatus(`Massa demo criada: ${payload.data.inserted} registros (ok: ${payload.data.summary.ok}, a vencer: ${payload.data.summary.atencao}, vencido: ${payload.data.summary.violado}).`);
  loadDashboard();
}

async function clearDemoData() {
  if (!accessToken) return alert('Faça login primeiro.');
  const proceed = window.confirm('Confirma remoção de TODOS os dados de demonstração?');
  if (!proceed) return;

  const res = await fetch(`${API}/admin/demo-data`, {
    method: 'DELETE',
    headers: headers()
  });

  const payload = await res.json();
  if (!res.ok) {
    setDemoStatus(payload.message || 'Falha ao limpar massa demo.', 'error');
    return;
  }

  setDemoStatus(`Limpeza concluída: ${payload.data.removed} registros removidos. Notificação enviada para ${payload.data.notified}.`);
  loadDashboard();
}

window.updateStatus = updateStatus;
document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('applyBtn').addEventListener('click', loadDashboard);
document.getElementById('seedDemoBtn').addEventListener('click', seedDemoData);
document.getElementById('clearDemoBtn').addEventListener('click', clearDemoData);
