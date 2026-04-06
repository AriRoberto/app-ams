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
  loadDashboard();
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
          <option>ABERTA</option>
          <option>EM_ANALISE</option>
          <option>EM_ATENDIMENTO</option>
          <option>CONCLUIDA</option>
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
}

window.updateStatus = updateStatus;
document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('applyBtn').addEventListener('click', loadDashboard);
