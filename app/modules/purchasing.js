// app/modules/purchasing.js
// Módulo Compras – Cabeceras y Acción de Recepción

import { apiFetch } from './utils.js'; // <--- FETCH SEGURO

export const title = 'Gestión de Compras';

const API_PURCHASE   = '/catalog/PurchaseOrders';
const API_SUPPLIERS  = '/catalog/Suppliers';
const API_CURRENCIES = '/catalog/Currencies';
const API_EMPLOYEES  = '/catalog/Employees';
const CSS_PATH       = './modules/purchasing.css';

function loadStyles() {
  if (!document.querySelector(`link[href="${CSS_PATH}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_PATH;
    document.head.appendChild(link);
  }
}

export function render(host) {
  loadStyles();

  const state = {
    list: [],
    suppliers: [],
    currencies: [],
    employees: [],
    suppMap: {},
    empMap: {},
    sortKey: 'orderDate',
    sortDir: 'desc',
    isEditing: false
  };

  // --- HTML TEMPLATE ---
  host.innerHTML = `
    <div class="pur-module">
      
      <header class="pur-header">
        <div class="pur-actions">
          <button type="button" class="btn ghost" id="btn-refresh">🔄 Actualizar</button>
          <button type="button" class="btn primary" id="btn-new">+ Nueva Orden</button>
        </div>
      </header>

      <div class="pur-body">
        
        <section class="pur-list">
          <div class="table-container">
            <table class="pur-table">
              <thead>
                <tr>
                  <th data-sort="orderNo">N° Orden <span class="sort-icon"></span></th>
                  <th data-sort="supplier_ID">Proveedor <span class="sort-icon"></span></th>
                  <th data-sort="buyer_ID">Comprador <span class="sort-icon"></span></th>
                  <th data-sort="orderDate">Fecha <span class="sort-icon"></span></th>
                  <th data-sort="status">Estado <span class="sort-icon"></span></th>
                  <th data-sort="totalAmount">Total <span class="sort-icon"></span></th>
                  <th style="width: 160px; text-align:center;">Acciones</th>
                </tr>
              </thead>
              <tbody id="pur-table-body">
                <tr><td colspan="7" style="text-align:center; padding:30px; color:#888;">Cargando compras...</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="pur-form-panel" class="pur-form-wrapper hidden">
          <header class="pur-form-header">
            <h3 id="form-title">Nueva Orden de Compra</h3>
          </header>
          
          <form id="pur-form" class="pur-form" autocomplete="off">
            <input type="hidden" name="id" />

            <div class="form-grid">
              <div class="form-group">
                <label>N° Orden *</label>
                <input name="orderNo" required maxlength="30" placeholder="OC-2024-001" />
              </div>

              <div class="form-group">
                <label>Fecha *</label>
                <input name="orderDate" type="date" required />
              </div>

              <div class="form-group full-width">
                <label>Comprador Responsable *</label>
                <select name="buyer_ID" required>
                  <option value="">Cargando personal...</option>
                </select>
              </div>

              <div class="form-group full-width">
                <label>Proveedor *</label>
                <select name="supplier_ID" required>
                  <option value="">Cargando proveedores...</option>
                </select>
              </div>

              <div class="form-group">
                <label>Estado</label>
                <input name="status" readonly value="CREATED" style="background:#eee; cursor:default;" />
              </div>

              <div class="form-group">
                <label>Moneda *</label>
                <select name="currency_code" required>
                  <option value="">Seleccione...</option>
                </select>
              </div>

              <div class="form-group">
                <label>Total (Estimado)</label>
                <input name="totalAmount" type="number" readonly placeholder="0.00" style="background:#eee;" />
              </div>

              <div class="form-group full-width">
                <label>Notas</label>
                <textarea name="notes" rows="3" maxlength="255"></textarea>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn secondary btn-full" id="btn-cancel">Cancelar</button>
              <button type="submit" class="btn primary btn-full" id="btn-save" disabled>Guardar</button>
            </div>
          </form>
        </section>

      </div>
    </div>
  `;

  const tbody = host.querySelector('#pur-table-body');
  const formPanel = host.querySelector('#pur-form-panel');
  const form = host.querySelector('#pur-form');
  const formTitle = host.querySelector('#form-title');
  const btnSave = host.querySelector('#btn-save');
  
  const selSupp = form.elements.supplier_ID;
  const selCurr = form.elements.currency_code;
  const selBuyer = form.elements.buyer_ID;

  // --- LÓGICA ---

  async function loadData() {
    try {
      // USAR APIFETCH
      const [resPur, resSup, resCur, resEmp] = await Promise.all([
        apiFetch(`${API_PURCHASE}?$orderby=orderDate desc`),
        apiFetch(`${API_SUPPLIERS}?$orderby=name asc`),
        apiFetch(`${API_CURRENCIES}?$orderby=code asc`),
        apiFetch(`${API_EMPLOYEES}?$orderby=lastName asc`)
      ]);

      const dPur = await resPur.json();
      const dSup = await resSup.json();
      const dCur = await resCur.json();
      const dEmp = await resEmp.json();

      state.list = dPur.value || [];
      state.suppliers = dSup.value || [];
      state.currencies = dCur.value || [];
      state.employees = dEmp.value || [];

      state.suppMap = {};
      state.suppliers.forEach(s => state.suppMap[s.ID] = s.name);
      
      state.empMap = {};
      state.employees.forEach(e => state.empMap[e.ID] = `${e.firstName} ${e.lastName}`);

      renderTable();
      updateSelects();
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Error al cargar datos</td></tr>`;
    }
  }

  function renderTable() {
    const sorted = [...state.list].sort((a, b) => {
      let valA = a[state.sortKey];
      let valB = b[state.sortKey];
      if (state.sortKey === 'totalAmount') { valA = Number(valA||0); valB = Number(valB||0); }
      else { valA = (valA||'').toString().toLowerCase(); valB = (valB||'').toString().toLowerCase(); }
      
      if (valA < valB) return state.sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return state.sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    tbody.innerHTML = '';
    if (sorted.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#888;">No hay órdenes de compra.</td></tr>`;
      return;
    }

    sorted.forEach(o => {
      const suppName = state.suppMap[o.supplier_ID] || 'Proveedor desconocido';
      const buyerName = state.empMap[o.buyer_ID] || 'Sin asignar';
      const dateFmt = o.orderDate ? o.orderDate.slice(0,10) : '-';
      const totalFmt = o.totalAmount ? `${Number(o.totalAmount).toLocaleString()} ${o.currency_code}` : '-';
      
      let stStyle = 'color:#555';
      if (o.status === 'RECEIVED') stStyle = 'color:#2e7d32; font-weight:bold;';
      if (o.status === 'CREATED') stStyle = 'color:#0056b3; font-weight:bold;';

      const btnReceive = o.status !== 'RECEIVED' 
        ? `<button class="btn tiny success" data-action="receive" data-id="${o.ID}" title="Recibir Mercadería">📦 Recibir</button>`
        : `<span style="font-size:0.8rem; color:green;">✔ Completado</span>`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(o.orderNo)}</strong></td>
        <td>${escapeHtml(suppName)}</td>
        <td style="font-size:0.85rem; color:#555;">${escapeHtml(buyerName)}</td>
        <td>${dateFmt}</td>
        <td><span style="${stStyle}">${escapeHtml(o.status)}</span></td>
        <td style="text-align:right;">${totalFmt}</td>
        <td style="text-align:center;">
          ${btnReceive}
          <button class="btn tiny" data-action="edit" data-id="${o.ID}" title="Editar">✏️</button>
          <button class="btn tiny danger" data-action="delete" data-id="${o.ID}" title="Eliminar">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    updateHeaderIcons();
  }

  function updateHeaderIcons() {
    host.querySelectorAll('th[data-sort]').forEach(th => {
      const key = th.dataset.sort;
      if (key === state.sortKey) {
        th.querySelector('.sort-icon').textContent = state.sortDir === 'asc' ? ' ▲' : ' ▼';
        th.style.backgroundColor = '#e0e8f0';
      } else {
        th.querySelector('.sort-icon').textContent = '';
        th.style.backgroundColor = '';
      }
    });
  }

  function updateSelects() {
    selSupp.innerHTML = '<option value="">-- Seleccione Proveedor --</option>';
    state.suppliers.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.ID;
      opt.textContent = s.name;
      selSupp.appendChild(opt);
    });

    selCurr.innerHTML = '<option value="">-- Moneda --</option>';
    state.currencies.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.code;
      opt.textContent = c.code;
      selCurr.appendChild(opt);
    });

    selBuyer.innerHTML = '<option value="">-- Quién compra --</option>';
    state.employees.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.ID;
      opt.textContent = `${e.firstName} ${e.lastName} (${e.role || 'Staff'})`;
      selBuyer.appendChild(opt);
    });
  }

  function toggleForm(show, mode = 'new', data = null) {
    if (!show) { formPanel.classList.add('hidden'); form.reset(); return; }
    formPanel.classList.remove('hidden');
    checkValidity();

    if (mode === 'new') {
      formTitle.textContent = 'Nueva Orden';
      btnSave.textContent = 'Crear Orden';
      state.isEditing = false;
      form.reset();
      form.elements.id.value = '';
      form.elements.orderDate.value = new Date().toISOString().slice(0,10);
      form.elements.status.value = 'CREATED';
      if(state.currencies.find(c=>c.code==='CLP')) form.elements.currency_code.value = 'CLP';
    } else {
      formTitle.textContent = 'Editar Orden';
      btnSave.textContent = 'Guardar Cambios';
      state.isEditing = true;
      
      form.elements.id.value = data.ID;
      form.elements.orderNo.value = data.orderNo || '';
      form.elements.orderDate.value = data.orderDate ? data.orderDate.slice(0,10) : '';
      form.elements.supplier_ID.value = data.supplier_ID || '';
      form.elements.buyer_ID.value = data.buyer_ID || '';
      form.elements.status.value = data.status || 'CREATED';
      form.elements.currency_code.value = data.currency_code || '';
      form.elements.totalAmount.value = data.totalAmount || '';
      form.elements.notes.value = data.notes || '';
    }
  }

  function checkValidity() {
    if (form.elements.orderNo.value.trim() && form.elements.supplier_ID.value && form.elements.buyer_ID.value) {
      btnSave.removeAttribute('disabled');
    } else {
      btnSave.setAttribute('disabled', 'true');
    }
  }

  host.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      else { state.sortKey = key; state.sortDir = 'asc'; }
      renderTable();
    });
  });

  host.querySelector('#btn-refresh').addEventListener('click', loadData);
  host.querySelector('#btn-new').addEventListener('click', () => toggleForm(true, 'new'));
  host.querySelector('#btn-cancel').addEventListener('click', () => toggleForm(false));
  form.addEventListener('input', checkValidity);

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const formData = new FormData(form);
    const payload = {
      orderNo: formData.get('orderNo').trim(),
      orderDate: formData.get('orderDate'),
      supplier_ID: formData.get('supplier_ID'),
      buyer_ID: formData.get('buyer_ID'),
      status: 'CREATED', 
      currency_code: formData.get('currency_code'),
      notes: formData.get('notes')
    };

    try {
      const id = formData.get('id');
      if (id) {
        await apiUpdate(id, payload);
        showToast('Orden actualizada');
      } else {
        await apiCreate(payload);
        showToast('Orden creada');
      }
      toggleForm(false);
      loadData();
    } catch (err) { alert(err.message); }
  });

  tbody.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'receive') {
      if (confirm('¿Confirmar recepción? Esto aumentará el stock.')) {
        try {
          await apiReceiveOrder(id);
          showToast('✅ Mercadería recibida');
          loadData();
        } catch (err) { alert('Error: ' + err.message); }
      }
    } else if (action === 'edit') {
      const item = state.list.find(x => x.ID === id);
      if (item) toggleForm(true, 'edit', item);
    } else if (action === 'delete') {
      if (confirm('¿Eliminar orden?')) {
        try {
          await apiDelete(id);
          showToast('Orden eliminada');
          loadData();
          if (form.elements.id.value === id) toggleForm(false);
        } catch (err) { alert(err.message); }
      }
    }
  });

  loadData();
}

function escapeHtml(text) {
  if (!text) return '';
  return text.toString().replace(/</g, "&lt;");
}
function showToast(msg) {
  const div = document.createElement('div');
  div.className = 'toast-success';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// --- API SEGURO (USANDO apiFetch) ---

async function apiCreate(data) {
  const res = await apiFetch(API_PURCHASE, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  if (!res.ok) throw new Error(await res.text());
}
async function apiUpdate(id, data) {
  const res = await apiFetch(`${API_PURCHASE}/${id}`, {method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  if (!res.ok) throw new Error(await res.text());
}
async function apiDelete(id) {
  const res = await apiFetch(`${API_PURCHASE}/${id}`, {method: 'DELETE'});
  if (!res.ok) throw new Error(await res.text());
}

async function apiReceiveOrder(id) {
  const res = await apiFetch(`${API_PURCHASE}/${id}/CatalogService.receive`, {
    method: 'POST', 
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({}) 
  });
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error?.message || 'Error al recibir');
  }
}