const API = '/api';
let accessToken = '';

const STATUS_OPTIONS = [
  ['ABERTA', 'Aberta'],
  ['EM_ANALISE', 'Em análise'],
  ['EM_ATENDIMENTO', 'Em atendimento'],
  ['ENCAMINHADO_EXECUTIVO', 'Encaminhado ao Executivo'],
  ['CONCLUIDA', 'Concluída']
];

const EXECUTIVE_RESPONSE_OPTIONS = [
  ['', 'Sem indicação'],
  ['DEFERIDO', 'Deferido'],
  ['INDEFERIDO', 'Indeferido']
];

const ANALYTICS_CHARTS = {
  pie: 'Pizza',
  bar: 'Barras verticais',
  horizontalBar: 'Barras horizontais',
  line: 'Linha',
  donut: 'Donut',
  area: 'Área',
  radar: 'Radar'
};

const ANALYTICS_PALETTE = ['#0b5cad', '#177245', '#d97706', '#b3261e', '#6d5dfc', '#0891b2', '#be185d', '#475569'];
let activeChartType = 'pie';
let analyticsRows = [];
let dashboardTickets = [];

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

function renderOptions(options, selectedValue) {
  return options
    .map(([value, label]) => `<option value="${value}" ${selectedValue === value ? 'selected' : ''}>${label}</option>`)
    .join('');
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatCpf(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 11) return value || 'CPF não informado';
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function getRequester(ticket) {
  const name = ticket.usuarioNome || ticket.nomeCidadao || 'Solicitante não informado';
  const email = ticket.usuarioEmail || '';
  const cpf = formatCpf(ticket.usuarioCpf);

  return {
    title: name,
    detail: email ? `${email} · CPF ${cpf}` : `CPF ${cpf}`
  };
}

function renderRequester(ticket) {
  const requester = getRequester(ticket);
  return `
    <div class="requester-cell">
      <strong>${escapeHtml(requester.title)}</strong>
      <span>${escapeHtml(requester.detail)}</span>
    </div>
  `;
}

function formatStatus(value) {
  const found = STATUS_OPTIONS.find(([status]) => status === value);
  return found ? found[1] : value;
}

function normalizeCssToken(value) {
  return String(value || '').toLowerCase().replaceAll('_', '-');
}

function renderStatusBadge(status) {
  return `<span class="status-badge status-${normalizeCssToken(status)}">${escapeHtml(formatStatus(status))}</span>`;
}

function renderSlaBadge(status) {
  return `<span class="sla-badge sla-${normalizeCssToken(status)}">${escapeHtml(formatSla(status))}</span>`;
}

function formatCategory(value) {
  const labels = {
    LAMPADA_QUEIMADA: 'Lâmpada queimada',
    BURACO_NA_RUA: 'Buracos em vias',
    ILUMINACAO_PUBLICA: 'Iluminação pública',
    LIMPEZA_URBANA: 'Limpeza urbana',
    AGUA_ESGOTO: 'Água e esgoto',
    COLETA_LIXO: 'Coleta de lixo',
    PODA_ARVORE: 'Poda de árvore',
    SINALIZACAO_VIARIA: 'Sinalização viária',
    CALCADA_DANIFICADA: 'Calçada danificada',
    ANIMAL_SOLTO: 'Animal solto',
    DRENAGEM_PLUVIAL: 'Drenagem pluvial',
    PROBLEMA_ESCOLA: 'Escola',
    PROBLEMA_POSTO_SAUDE: 'Posto de saúde',
    PROBLEMA_PRACA: 'Praça',
    MATO_ALTO: 'Mato alto',
    ENTULHO: 'Entulho',
    VAZAMENTO: 'Vazamento',
    OUTRO: 'Outro'
  };
  return labels[value] || value || 'Não informado';
}

function formatPriority(value) {
  const labels = { baixa: 'Baixa', normal: 'Normal', alta: 'Alta' };
  return labels[value] || value || 'Não informada';
}

function formatSla(value) {
  const labels = { violado: 'SLA vencido', atencao: 'SLA a vencer', ok: 'SLA em dia' };
  return labels[value] || value || 'Não informado';
}

function analyticsQueryString() {
  const params = new URLSearchParams();
  const map = {
    analyticsBairro: 'bairro',
    analyticsCategoria: 'categoria',
    analyticsStatus: 'status',
    analyticsPriority: 'priority',
    analyticsDataInicio: 'dataInicio',
    analyticsDataFim: 'dataFim'
  };

  Object.entries(map).forEach(([id, key]) => {
    const value = document.getElementById(id)?.value;
    if (value) params.set(key, value);
  });

  params.set('pageSize', '100');
  return params.toString();
}

function getAnalyticsDimension() {
  return document.getElementById('analyticsDimension')?.value || 'demanda';
}

function getDimensionMeta() {
  const dimension = getAnalyticsDimension();
  if (dimension === 'bairro') {
    return { key: 'bairro', title: 'Bairros com maior volume', formatter: (value) => value || 'Não informado' };
  }
  if (dimension === 'problema') {
    return { key: 'sla_status', title: 'Problemas críticos por SLA', formatter: formatSla };
  }
  return { key: 'categoria', title: 'Demandas mais registradas', formatter: formatCategory };
}

function aggregateBy(rows, key, formatter = (value) => value || 'Não informado') {
  const totals = rows.reduce((acc, row) => {
    const raw = row[key] || 'Não informado';
    const label = formatter(raw);
    acc.set(label, (acc.get(label) || 0) + 1);
    return acc;
  }, new Map());

  return [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function getTopItem(items) {
  return items[0] || { label: '-', value: 0 };
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function populateAnalyticsSelect(id, rows, key, formatter = (value) => value || 'Não informado') {
  const select = document.getElementById(id);
  if (!select) return;

  const current = select.value;
  const firstLabel = select.options[0]?.textContent || 'Todos';
  const existingValues = [...select.options].map((option) => option.value).filter(Boolean);
  const values = [...new Set([...existingValues, ...rows.map((row) => row[key]).filter(Boolean)])].sort();
  select.innerHTML = `<option value="">${firstLabel}</option>${values
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(formatter(value))}</option>`)
    .join('')}`;
  select.value = values.includes(current) ? current : '';
}

function updateAnalyticsControls(rows) {
  populateAnalyticsSelect('analyticsBairro', rows, 'bairro');
  populateAnalyticsSelect('analyticsCategoria', rows, 'categoria', formatCategory);
}

function renderAnalyticsSummary(rows) {
  const total = rows.length;
  const topBairro = getTopItem(aggregateBy(rows, 'bairro'));
  const topProblem = getTopItem(aggregateBy(rows, 'categoria', formatCategory));
  const topDemand = getTopItem(aggregateBy(rows, 'priority', formatPriority));

  document.getElementById('analyticsSummary').innerHTML = [
    ['Total de solicitações', total, 'Volume filtrado no período'],
    ['Bairro líder', topBairro.label, `${topBairro.value} ocorrência(s)`],
    ['Problema recorrente', topProblem.label, `${topProblem.value} registro(s)`],
    ['Demanda registrada', topDemand.label, `${topDemand.value} ocorrência(s)`]
  ].map(([title, value, detail]) => `
    <article class="analytics-kpi">
      <span>${escapeHtml(title)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </article>
  `).join('');
}

function renderLegend(items, total) {
  document.getElementById('analyticsLegend').innerHTML = items.slice(0, 8).map((item, index) => `
    <span class="legend-item">
      <i style="background:${ANALYTICS_PALETTE[index % ANALYTICS_PALETTE.length]}"></i>
      ${escapeHtml(item.label)} · ${item.value} (${percent(item.value, total)}%)
    </span>
  `).join('');
}

function polarToCartesian(cx, cy, radius, angle) {
  const radians = (angle - 90) * Math.PI / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians)
  };
}

function describeArc(cx, cy, radius, startAngle, endAngle, innerRadius = 0) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';

  if (!innerRadius) {
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
  }

  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
  return [
    `M ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y}`,
    'Z'
  ].join(' ');
}

function renderPieChart(items, total, donut = false) {
  let cursor = 0;
  const paths = items.map((item, index) => {
    const start = cursor;
    const valueAngle = total ? (item.value / total) * 360 : 0;
    cursor += valueAngle;
    const color = ANALYTICS_PALETTE[index % ANALYTICS_PALETTE.length];
    return `<path d="${describeArc(190, 150, 118, start, cursor, donut ? 62 : 0)}" fill="${color}">
      <title>${escapeHtml(item.label)}: ${item.value} solicitações (${percent(item.value, total)}%)</title>
    </path>`;
  }).join('');

  const center = donut
    ? `<text x="190" y="145" text-anchor="middle" class="chart-total">${total}</text><text x="190" y="169" text-anchor="middle" class="chart-subtitle">solicitações</text>`
    : '';

  return `<svg viewBox="0 0 380 300" role="img" aria-label="Gráfico ${donut ? 'donut' : 'pizza'}">${paths}${center}</svg>`;
}

function renderBarChart(items, horizontal = false) {
  const max = Math.max(...items.map((item) => item.value), 1);

  if (horizontal) {
    const rows = items.slice(0, 8).map((item, index) => {
      const width = (item.value / max) * 250;
      const y = 22 + index * 31;
      return `
        <text x="8" y="${y + 14}" class="axis-label">${escapeHtml(item.label.slice(0, 22))}</text>
        <rect x="150" y="${y}" width="${width}" height="18" rx="5" fill="${ANALYTICS_PALETTE[index % ANALYTICS_PALETTE.length]}">
          <title>${escapeHtml(item.label)}: ${item.value}</title>
        </rect>
        <text x="${158 + width}" y="${y + 14}" class="value-label">${item.value}</text>
      `;
    }).join('');
    return `<svg viewBox="0 0 430 300" role="img" aria-label="Gráfico de barras horizontais">${rows}</svg>`;
  }

  const bars = items.slice(0, 8).map((item, index) => {
    const width = 32;
    const height = (item.value / max) * 180;
    const x = 34 + index * 45;
    const y = 220 - height;
    return `
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="${ANALYTICS_PALETTE[index % ANALYTICS_PALETTE.length]}">
        <title>${escapeHtml(item.label)}: ${item.value}</title>
      </rect>
      <text x="${x + width / 2}" y="${y - 8}" text-anchor="middle" class="value-label">${item.value}</text>
      <text x="${x + width / 2}" y="248" text-anchor="middle" class="axis-label">${escapeHtml(item.label.slice(0, 8))}</text>
    `;
  }).join('');

  return `<svg viewBox="0 0 420 300" role="img" aria-label="Gráfico de barras verticais">${bars}<line x1="20" y1="220" x2="400" y2="220" class="chart-axis" /></svg>`;
}

function renderLineChart(items, area = false) {
  const series = items.slice(0, 8).reverse();
  const max = Math.max(...series.map((item) => item.value), 1);
  const points = series.map((item, index) => {
    const x = 34 + index * (330 / Math.max(series.length - 1, 1));
    const y = 220 - (item.value / max) * 170;
    return { ...item, x, y };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPath = `M ${points[0]?.x || 34},220 L ${line} L ${points.at(-1)?.x || 364},220 Z`;

  return `<svg viewBox="0 0 420 300" role="img" aria-label="Gráfico de ${area ? 'área' : 'linha'}">
    ${area ? `<polygon points="${areaPath.replaceAll(/[MLZ]/g, '')}" class="area-fill"></polygon>` : ''}
    <polyline points="${line}" class="line-chart"></polyline>
    ${points.map((point) => `
      <circle cx="${point.x}" cy="${point.y}" r="5" class="line-point">
        <title>${escapeHtml(point.label)}: ${point.value}</title>
      </circle>
      <text x="${point.x}" y="248" text-anchor="middle" class="axis-label">${escapeHtml(point.label.slice(0, 8))}</text>
    `).join('')}
    <line x1="20" y1="220" x2="400" y2="220" class="chart-axis" />
  </svg>`;
}

function renderRadarChart(items) {
  const series = items.slice(0, 7);
  const max = Math.max(...series.map((item) => item.value), 1);
  const cx = 190;
  const cy = 150;
  const radius = 105;
  const points = series.map((item, index) => {
    const angle = (index / series.length) * 360;
    const outer = polarToCartesian(cx, cy, radius, angle);
    const valuePoint = polarToCartesian(cx, cy, (item.value / max) * radius, angle);
    return { ...item, outer, valuePoint };
  });
  const polygon = points.map((item) => `${item.valuePoint.x},${item.valuePoint.y}`).join(' ');

  return `<svg viewBox="0 0 380 300" role="img" aria-label="Gráfico radar">
    ${[0.33, 0.66, 1].map((scale) => `<circle cx="${cx}" cy="${cy}" r="${radius * scale}" class="radar-ring"></circle>`).join('')}
    ${points.map((point) => `
      <line x1="${cx}" y1="${cy}" x2="${point.outer.x}" y2="${point.outer.y}" class="radar-axis"></line>
      <text x="${point.outer.x}" y="${point.outer.y}" class="axis-label">${escapeHtml(point.label.slice(0, 10))}</text>
    `).join('')}
    <polygon points="${polygon}" class="radar-area"></polygon>
    ${points.map((point) => `<circle cx="${point.valuePoint.x}" cy="${point.valuePoint.y}" r="4" class="line-point"><title>${escapeHtml(point.label)}: ${point.value}</title></circle>`).join('')}
  </svg>`;
}

function renderAnalyticsChart(items, total) {
  const target = document.getElementById('analyticsChart');
  if (!items.length) {
    target.innerHTML = '<div class="empty-state">Sem dados para os filtros selecionados.</div>';
    document.getElementById('analyticsLegend').innerHTML = '';
    return;
  }

  const limited = items.slice(0, 8);
  const renderers = {
    pie: () => renderPieChart(limited, total),
    donut: () => renderPieChart(limited, total, true),
    bar: () => renderBarChart(limited),
    horizontalBar: () => renderBarChart(limited, true),
    line: () => renderLineChart(limited),
    area: () => renderLineChart(limited, true),
    radar: () => renderRadarChart(limited)
  };

  target.classList.remove('chart-animate');
  target.innerHTML = renderers[activeChartType]();
  window.requestAnimationFrame(() => target.classList.add('chart-animate'));
  renderLegend(limited, total);
}

function renderInsights(rows, groupedItems) {
  const total = rows.length;
  const topBairro = getTopItem(aggregateBy(rows, 'bairro'));
  const topProblem = getTopItem(aggregateBy(rows, 'categoria', formatCategory));
  const violados = rows.filter((row) => row.sla_status === 'violado').length;
  const top = getTopItem(groupedItems);
  const insights = [
    total ? `${topBairro.label} concentra ${percent(topBairro.value, total)}% das solicitações filtradas.` : 'Nenhuma solicitação encontrada no período.',
    total ? `${topProblem.label} é o problema mais recorrente no recorte atual.` : 'Ajuste os filtros para gerar uma leitura executiva.',
    violados ? `${violados} solicitação(ões) estão com SLA vencido e exigem prioridade gerencial.` : 'Não há solicitações vencidas neste recorte.',
    total ? `${top.label} lidera a visualização atual em ${ANALYTICS_CHARTS[activeChartType].toLowerCase()}.` : 'O gráfico será atualizado automaticamente quando houver dados.'
  ];

  document.getElementById('analyticsInsights').innerHTML = insights
    .map((item) => `<p>${escapeHtml(item)}</p>`)
    .join('');

  document.getElementById('analyticsRanking').innerHTML = groupedItems.slice(0, 5).map((item, index) => `
    <div class="ranking-row">
      <span>${index + 1}</span>
      <strong>${escapeHtml(item.label)}</strong>
      <em>${item.value}</em>
    </div>
  `).join('');
}

function csvEscape(value) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvEscape).join(';')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportAnalyticsCsv() {
  const rows = [
    ['Bairro', 'Categoria', 'Status', 'Prioridade', 'SLA', 'Solicitante', 'Email', 'CPF', 'Criado em'],
    ...analyticsRows.map((ticket) => [
      ticket.bairro || '',
      formatCategory(ticket.categoria),
      formatStatus(ticket.status),
      formatPriority(ticket.priority),
      formatSla(ticket.sla_status),
      ticket.usuarioNome || ticket.nomeCidadao || '',
      ticket.usuarioEmail || '',
      formatCpf(ticket.usuarioCpf),
      ticket.created_at ? new Date(ticket.created_at).toLocaleString('pt-BR') : ''
    ])
  ];

  downloadCsv('dashboard-solicitacoes-urbanas.csv', rows);
}

async function loadAnalytics() {
  if (!accessToken) return;

  const loader = document.getElementById('analyticsLoading');
  loader.hidden = false;

  try {
    const response = await fetch(`${API}/admin/dashboard/tickets?${analyticsQueryString()}`, { headers: headers() });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'Erro ao carregar análise.');

    const problem = document.getElementById('analyticsProblem').value;
    const rows = problem
      ? (payload.data || []).filter((row) => row.sla_status === problem)
      : (payload.data || []);

    analyticsRows = rows;
    updateAnalyticsControls(payload.data || []);
    renderAnalyticsSummary(rows);

    const meta = getDimensionMeta();
    const grouped = aggregateBy(rows, meta.key, meta.formatter);
    document.querySelector('.chart-panel')?.setAttribute('data-title', meta.title);
    renderAnalyticsChart(grouped, rows.length);
    renderInsights(rows, grouped);
  } catch (error) {
    document.getElementById('analyticsChart').innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  } finally {
    loader.hidden = true;
  }
}

function renderExecutiveBoard(tickets = []) {
  const board = document.getElementById('executiveBoard');
  const count = document.getElementById('executiveBoardCount');
  const criticalCount = document.getElementById('executiveCriticalCount');
  const attentionCount = document.getElementById('executiveAttentionCount');
  const critical = tickets.filter((ticket) => ticket.sla_status === 'violado').length;
  const attention = tickets.filter((ticket) => ticket.sla_status === 'atencao').length;

  count.textContent = `${tickets.length} chamado${tickets.length === 1 ? '' : 's'}`;
  criticalCount.textContent = `${critical} crítico${critical === 1 ? '' : 's'}`;
  attentionCount.textContent = `${attention} a vencer`;

  if (!tickets.length) {
    board.innerHTML = '<p class="empty-state">Nenhum chamado encontrado para os filtros atuais.</p>';
    return;
  }

  board.innerHTML = tickets.map((ticket) => `
    <article class="executive-action-card">
      <header class="executive-card-header">
        <div>
          <h3>${escapeHtml(ticket.bairro || 'Bairro não informado')}</h3>
          <p>${escapeHtml(ticket.categoria)}</p>
          ${renderRequester(ticket)}
        </div>
        ${renderSlaBadge(ticket.sla_status)}
      </header>

      <div class="status-flow">
        <span class="status-step ${ticket.status === 'ABERTA' ? 'active' : ''}">Aberta</span>
        <span class="status-step ${ticket.status === 'EM_ANALISE' ? 'active' : ''}">Análise</span>
        <span class="status-step ${ticket.status === 'EM_ATENDIMENTO' ? 'active' : ''}">Atendimento</span>
        <span class="status-step ${ticket.status === 'ENCAMINHADO_EXECUTIVO' ? 'active' : ''}">Executivo</span>
        <span class="status-step ${ticket.status === 'CONCLUIDA' ? 'active' : ''}">Concluída</span>
      </div>

      <div class="executive-actions">
        <label>Status da solicitação
          <select data-id="${ticket.id}">
            ${renderOptions(STATUS_OPTIONS, ticket.status)}
          </select>
        </label>
        <label>Resposta do Executivo
          <select data-response-id="${ticket.id}">
            ${renderOptions(EXECUTIVE_RESPONSE_OPTIONS, ticket.executive_response_status || '')}
          </select>
        </label>
      </div>

      <div class="executive-card-footer">
        <span class="requirement-pill ${ticket.requirement_form_enabled ? 'enabled' : ''}">
          ${ticket.requirement_form_enabled ? 'Requerimento habilitado' : 'Sem requerimento'}
        </span>
        <span class="time-cell">${escapeHtml(ticket.tempo_restante)}</span>
        <button class="primary-btn" onclick="updateStatus('${ticket.id}')">Salvar ação</button>
      </div>
    </article>
  `).join('');
}

function matchesTicketSearch(ticket, term) {
  if (!term) return true;
  const requester = getRequester(ticket);
  const searchable = [
    requester.title,
    requester.detail,
    ticket.bairro,
    formatCategory(ticket.categoria),
    formatStatus(ticket.status),
    formatSla(ticket.sla_status),
    formatPriority(ticket.priority)
  ].join(' ').toLowerCase();
  return searchable.includes(term);
}

function renderTicketTable(tickets = dashboardTickets) {
  const term = (document.getElementById('ticketSearch')?.value || '').trim().toLowerCase();
  const filtered = tickets.filter((ticket) => matchesTicketSearch(ticket, term));
  const tbody = document.querySelector('#ticketsTable tbody');

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6">Nenhum chamado encontrado para a busca atual.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((ticket) => `
    <tr>
      <td>${renderRequester(ticket)}</td>
      <td class="neighborhood-cell">${escapeHtml(ticket.bairro || '-')}</td>
      <td>${escapeHtml(formatCategory(ticket.categoria))}</td>
      <td>${renderStatusBadge(ticket.status)}</td>
      <td>${renderSlaBadge(ticket.sla_status)}</td>
      <td class="time-cell">${escapeHtml(ticket.tempo_restante)}</td>
    </tr>
  `).join('');
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

  dashboardTickets = ticketsPayload.data || [];
  renderTicketTable(dashboardTickets);
  renderExecutiveBoard(dashboardTickets);
  await loadAnalytics();
}

async function updateStatus(id) {
  const select = document.querySelector(`select[data-id='${id}']`);
  const executiveResponseSelect = document.querySelector(`select[data-response-id='${id}']`);
  const status = select.value;
  const executiveResponseStatus = executiveResponseSelect.value || null;
  const res = await fetch(`${API}/admin/tickets/${id}/status`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ status, executiveResponseStatus })
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
document.getElementById('refreshAnalyticsBtn').addEventListener('click', loadAnalytics);
document.getElementById('exportAnalyticsBtn').addEventListener('click', exportAnalyticsCsv);
document.getElementById('ticketSearch').addEventListener('input', () => renderTicketTable());

document.querySelectorAll('.chart-type-btn').forEach((button) => {
  button.addEventListener('click', () => {
    activeChartType = button.dataset.chartType || 'pie';
    document.querySelectorAll('.chart-type-btn').forEach((item) => item.classList.toggle('active', item === button));
    const meta = getDimensionMeta();
    const grouped = aggregateBy(analyticsRows, meta.key, meta.formatter);
    renderAnalyticsChart(grouped, analyticsRows.length);
    renderInsights(analyticsRows, grouped);
  });
});

[
  'analyticsDataInicio',
  'analyticsDataFim',
  'analyticsBairro',
  'analyticsCategoria',
  'analyticsProblem',
  'analyticsStatus',
  'analyticsPriority',
  'analyticsDimension'
].forEach((id) => {
  document.getElementById(id).addEventListener('change', loadAnalytics);
});
