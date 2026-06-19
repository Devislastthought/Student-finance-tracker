import { highlight } from './search.js';
import { getSettings } from './state.js';

export function showSection(id) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));

  const section = document.getElementById(id);
  const link    = document.querySelector(`.nav-link[data-section="${id}"]`);
  if (section) section.classList.add('active');
  if (link)    link.classList.add('active');
}
export function renderTable(records, re) {
  const tbody    = document.getElementById('records-body');
  const emptyMsg = document.getElementById('empty-msg');

  tbody.innerHTML = '';

  if (records.length === 0) {
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';

  records.forEach(rec => {
    const tr = document.createElement('tr');
    tr.dataset.id = rec.id;

    const descHtml = highlight(rec.description, re);
    const catHtml  = highlight(rec.category,    re);
    const badge    = badgeHtml(rec.category);

    tr.innerHTML = `
      <td>${descHtml}</td>
      <td>$${parseFloat(rec.amount).toFixed(2)}</td>
      <td>${badge}</td>
      <td>${rec.date}</td>
      <td>
        <button class="btn-edit"   aria-label="Edit ${rec.description}"   data-id="${rec.id}">Edit</button>
        <button class="btn-delete" aria-label="Delete ${rec.description}" data-id="${rec.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}


export function makeRowEditable(tr, rec) {
  const settings = getSettings();
  const catOpts  = settings.categories
    .map(c => `<option value="${c}" ${c === rec.category ? 'selected' : ''}>${c}</option>`)
    .join('');

  tr.innerHTML = `
    <td><input class="edit-input" id="ei-desc"   value="${escAttr(rec.description)}" aria-label="Edit description" /></td>
    <td><input class="edit-input" id="ei-amount" value="${rec.amount}" type="text"  aria-label="Edit amount" /></td>
    <td>
      <select class="edit-input" id="ei-cat" aria-label="Edit category">
        ${catOpts}
      </select>
    </td>
    <td><input class="edit-input" id="ei-date" type="date" value="${rec.date}" aria-label="Edit date" /></td>
    <td>
      <button class="btn-edit"   data-save="${rec.id}" aria-label="Save">Save</button>
      <button class="btn-delete" data-cancel="${rec.id}" aria-label="Cancel">Cancel</button>
    </td>
  `;
}

function escAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function badgeHtml(cat) {
  const knownBadges = ['Food','Books','Transport','Entertainment','Fees','Other'];
  const cls = knownBadges.includes(cat) ? `badge-${cat}` : 'badge-default';
  return `<span class="badge ${cls}">${cat}</span>`;
}

export function renderStats(records) {
  const total   = records.reduce((s, r) => s + parseFloat(r.amount), 0);
  const catMap  = {};
  records.forEach(r => { catMap[r.category] = (catMap[r.category] || 0) + 1; });
  const topCat  = Object.keys(catMap).sort((a,b) => catMap[b]-catMap[a])[0] || '—';
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekTotal = records
    .filter(r => new Date(r.date) >= weekAgo)
    .reduce((s, r) => s + parseFloat(r.amount), 0);

  document.getElementById('stat-count').textContent   = records.length;
  document.getElementById('stat-total').textContent   = `$${total.toFixed(2)}`;
  document.getElementById('stat-top-cat').textContent = topCat;
  document.getElementById('stat-week').textContent    = `$${weekTotal.toFixed(2)}`;

  renderBudgetBar(total);
  renderBarChart(records);
}

function renderBudgetBar(total) {
  const settings = getSettings();
  const budget   = parseFloat(settings.budget) || 0;
  const bar      = document.getElementById('budget-bar');
  const caption  = document.getElementById('budget-caption');
  const wrap     = document.querySelector('.budget-track');
  const alertEl  = document.getElementById('alert-msg');
  const statusEl = document.getElementById('status-msg');

  if (!budget) {
    caption.textContent = 'Set a budget in Settings.';
    bar.style.width = '0%';
    return;
  }

  const pct  = Math.min((total / budget) * 100, 100);
  bar.style.width = `${pct}%`;
  wrap.setAttribute('aria-valuenow', Math.round(pct));

  if (total > budget) {
    bar.classList.add('over');
    const over = (total - budget).toFixed(2);
    caption.textContent = `Over budget by $${over}!`;
    alertEl.textContent = `Warning: you are $${over} over your $${budget} budget.`;
    statusEl.textContent = '';
  } else {
    bar.classList.remove('over');
    const left = (budget - total).toFixed(2);
    caption.textContent = `$${left} remaining of $${budget} budget.`;
    statusEl.textContent = `Budget OK — $${left} remaining.`;
    alertEl.textContent  = '';
  }
}

function renderBarChart(records) {
  const container = document.getElementById('bar-chart');
  container.innerHTML = '';


  const buckets = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key   = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en', { weekday: 'short' });
    const total = records
      .filter(r => r.date === key)
      .reduce((s, r) => s + parseFloat(r.amount), 0);
    buckets.push({ label, total });
  }

  const max      = Math.max(...buckets.map(b => b.total), 1);
  const maxBarPx = 90;

  buckets.forEach(b => {
    const heightPx = Math.max(Math.round((b.total / max) * maxBarPx), b.total > 0 ? 4 : 0);
    const col = document.createElement('div');
    col.className = 'bar-col';
    col.innerHTML = `
      <div class="bar-block" style="height:${heightPx}px" title="$${b.total.toFixed(2)}"></div>
      <span class="bar-label">${b.label}</span>
    `;
    container.appendChild(col);
  });
}

export function renderCategoryList(categories, onDelete) {
  const ul = document.getElementById('cat-list');
  ul.innerHTML = '';
  categories.forEach(cat => {
    const li = document.createElement('li');
    li.textContent = cat;
    const btn = document.createElement('button');
    btn.className = 'btn-delete';
    btn.textContent = '✕';
    btn.setAttribute('aria-label', `Remove category ${cat}`);
    btn.addEventListener('click', () => onDelete(cat));
    li.appendChild(btn);
    ul.appendChild(li);
  });
}

export function renderCategoryOptions(categories) {
  const sel = document.getElementById('f-category');
  const cur = sel.value;
  sel.innerHTML = '<option value="">-- Select --</option>';
  categories.forEach(c => {
    const o = document.createElement('option');
    o.value = c; o.textContent = c;
    if (c === cur) o.selected = true;
    sel.appendChild(o);
  });
}

export function toast(msg, isError = false) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' error' : '');
  el.textContent = msg;
  el.setAttribute('role', 'status');
  document.body.appendChild(el);

  setTimeout(() => el.remove(), 3000);
}

export function setFieldError(inputId, errId, msg) {
  const input = document.getElementById(inputId);
  const err   = document.getElementById(errId);
  if (!input || !err) return;
  err.textContent = msg;
  if (msg) {
    input.classList.add('invalid');
    input.classList.remove('valid');
  } else {
    input.classList.remove('invalid');
    input.classList.add('valid');
  }
}

export function clearForm() {
  document.getElementById('expense-form').reset();
  document.getElementById('edit-id').value = '';
  document.getElementById('form-heading').textContent = 'Add Expense';
  document.getElementById('submit-btn').textContent   = 'Add Expense';
  ['f-description','f-amount','f-category','f-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('valid','invalid'); }
  });
  ['f-description-err','f-amount-err','f-category-err','f-date-err'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}
