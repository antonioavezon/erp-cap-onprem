// app/modules/salesorders.js
// Módulo Pedidos de venta – Versión Profesional con RRHH

export const title = 'Pedidos de venta';

const API_ORDERS     = '/catalog/SalesOrders';
const API_CUSTOMERS  = '/catalog/Customers';
const API_CURRENCIES = '/catalog/Currencies';
const API_EMPLOYEES  = '/catalog/Employees'; // <--- NUEVO: Cargar vendedores
const CSS_PATH       = './modules/salesorders.css';

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

  // Estado local
  const state = {
    list: [],
    customers: [],
    currencies: [],
    employees: [], // <--- Lista de personal
    custMap: {},   // Mapa ID -> Nombre Cliente
    empMap: {},    // Mapa ID -> Nombre Vendedor
    sortKey: 'orderDate',
    sortDir: 'desc',
    isEditing: false
  };

  // --- Template HTML ---
  host.innerHTML = `
    <div class="order-module">
      
      <header class="order-header">
        <div class="order-actions">
          <button type="button" class="btn ghost" id="btn-refresh" title="Recargar">
            🔄 Actualizar
          </button>
          <button type="button" class="btn primary" id="btn-new">
            + Nuevo pedido
          </button>
        </div>
      </header>

      <div class="order-body">
        
        <section class="order-list">
          <div class="table-container">
            <table class="order-table">
              <thead>
                <tr>
                  <th data-sort="orderNo">N° Pedido <span class="sort-icon"></span></th>
                  <th data-sort="customer_ID">Cliente <span class="sort-icon"></span></th>
                  <th data-sort="salesPerson_ID">Vendedor <span class="sort-icon"></span></th> <th data-sort="orderDate">Fecha <span class="sort-icon"></span></th>
                  <th data-sort="status">Estado <span class="sort-icon"></span></th>
                  <th data-sort="totalAmount">Total <span class="sort-icon"></span></th>
                  <th style="width: 110px; text-align:center;">Acciones</th>
                </tr>
              </thead>
              <tbody id="order-table-body">
                <tr>
                  <td colspan="7" style="text-align:center; padding:30px; color:#888;">
                    Cargando pedidos...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="order-form-panel" class="order-form-wrapper hidden">
          <header class="order-form-header">
            <h3 id="form-title">Nuevo Pedido</h3>
          </header>
          
          <form id="order-form" class="order-form" autocomplete="off">
            <input type="hidden" name="id" />

            <div class="form-grid">
              
              <div class="form-group">
                <label>N° Pedido *</label>
                <input name="orderNo" required maxlength="30" placeholder="Ej: PED-2024-001" />
              </div>

              <div class="form-group">
                <label>Fecha *</label>
                <input name="orderDate" type="date" required />
              </div>

              <div class="form-group full-width">
                <label>Vendedor Responsable *</label>
                <select name="salesPerson_ID" required>
                  <option value="">Cargando personal...</option>
                </select>
              </div>

              <div class="form-group full-width">
                <label>Cliente *</label>
                <select name="customer_ID" required>
                  <option value="">Cargando clientes...</option>
                </select>
              </div>

              <div class="form-group">
                <label>Estado</label>
                <select name="status">
                  <option value="ABIERTO">ABIERTO</option>
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="CERRADO">CERRADO</option>
                  <option value="CANCELADO">CANCELADO</option>
                </select>
              </div>

              <div class="form-group">
                <label>Moneda *</label>
                <select name="currency_code" required>
                  <option value="">Seleccione...</option>
                </select>
              </div>

              <div class="form-group">
                <label>Total (Cabecera)</label>
                <input name="totalAmount" type="number" min="0" step="0.01" placeholder="0.00" />
              </div>

              <div class="form-group full-width">
                <label>Notas</label>
                <textarea name="notes" rows="3" maxlength="255" placeholder="Observaciones..."></textarea>
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

  // DOM Refs
  const tbody = host.querySelector('#order-table-body');
  const formPanel = host.querySelector('#order-form-panel');
  const form = host.querySelector('#order-form');
  const formTitle = host.querySelector('#form-title');
  const btnSave = host.querySelector('#btn-save');
  
  // Selects
  const selCustomer = form.elements.customer_ID;
  const selCurrency = form.elements.currency_code;
  const selSalesPerson = form.elements.salesPerson_ID; // <--- Ref nuevo select

  // ============================================================
  // LÓGICA
  // ============================================================

  // 1. Cargar Datos
  async function loadData() {
    try {
      const [resOrders, resCust, resCurr, resEmp] = await Promise.all([
        fetch(`${API_ORDERS}?$orderby=orderDate desc`),
        fetch(`${API_CUSTOMERS}?$orderby=name asc`),
        fetch(`${API_CURRENCIES}?$orderby=code asc`),
        fetch(`${API_EMPLOYEES}?$orderby=lastName asc`)
      ]);

      const dOrders = await resOrders.json();
      const dCust = await resCust.json();
      const dCurr = await resCurr.json();
      const dEmp = await resEmp.json();

      state.list = dOrders.value || [];
      state.customers = dCust.value || [];
      state.currencies = dCurr.value || [];
      state.employees = dEmp.value || [];

      // Mapas rápidos
      state.custMap = {};
      state.customers.forEach(c => {
        state.custMap[c.ID] = c.name || c.taxNumber || 'Sin Nombre';
      });

      state.empMap = {};
      state.employees.forEach(e => {
        state.empMap[e.ID] = `${e.firstName} ${e.lastName}`;
      });

      renderTable();
      updateSelects();

    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Error al cargar datos</td></tr>`;
    }
  }

  // 2. Dibujar Tabla
  function renderTable() {
    const sortedList = [...state.list].sort((a, b) => {
      let valA = a[state.sortKey];
      let valB = b[state.sortKey];

      if (state.sortKey === 'totalAmount') {
         valA = Number(valA || 0);
         valB = Number(valB || 0);
      } else {
         valA = (valA || '').toString().toLowerCase();
         valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return state.sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return state.sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    tbody.innerHTML = '';

    if (sortedList.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="7" style="text-align:center; padding:40px; color:#888;">
          No hay pedidos registrados.
        </td></tr>`;
      return;
    }

    sortedList.forEach(o => {
      const custName = state.custMap[o.customer_ID] || 'Cliente desconocido';
      const sellerName = state.empMap[o.salesPerson_ID] || '-'; // Nombre Vendedor
      const dateFmt = formatDate(o.orderDate);
      const totalFmt = o.totalAmount != null 
        ? `${Number(o.totalAmount).toLocaleString('es-CL', { minimumFractionDigits: 2 })} ${o.currency_code}`
        : '-';

      // Estado con colores
      let statusStyle = 'color:#555;';
      if (o.status === 'ABIERTO') statusStyle = 'color:#0056b3; font-weight:bold;';
      if (o.status === 'CONFIRMED') statusStyle = 'color:#2e7d32; font-weight:bold;'; // Status confirmado por submit
      if (o.status === 'CERRADO') statusStyle = 'color:#555;';
      if (o.status === 'CANCELADO') statusStyle = 'color:#d00;';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(o.orderNo)}</strong></td>
        <td>${escapeHtml(custName)}</td>
        <td style="font-size:0.85rem; color:#555;">${escapeHtml(sellerName)}</td>
        <td>${dateFmt}</td>
        <td><span style="${statusStyle}">${escapeHtml(o.status)}</span></td>
        <td style="text-align:right;">${totalFmt}</td>
        <td style="text-align:center;">
          ${ o.status === 'ABIERTO' 
             ? `<button class="btn tiny success" data-action="submit" data-id="${o.ID}" title="Confirmar Venta">✔</button>` 
             : '' 
          }
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
      const icon = th.querySelector('.sort-icon');
      if (key === state.sortKey) {
        icon.textContent = state.sortDir === 'asc' ? ' ▲' : ' ▼';
        th.style.backgroundColor = '#e0e8f0';
      } else {
        icon.textContent = '';
        th.style.backgroundColor = '';
      }
    });
  }

  // 3. Actualizar Selects
  function updateSelects() {
    // Clientes
    selCustomer.innerHTML = '<option value="">-- Seleccione Cliente --</option>';
    state.customers.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.ID;
      opt.textContent = c.name || c.taxNumber;
      selCustomer.appendChild(opt);
    });

    // Monedas
    selCurrency.innerHTML = '<option value="">-- Moneda --</option>';
    state.currencies.forEach(curr => {
      const opt = document.createElement('option');
      opt.value = curr.code;
      opt.textContent = `${curr.code} - ${curr.name || ''}`;
      selCurrency.appendChild(opt);
    });

    // Vendedores (Empleados)
    selSalesPerson.innerHTML = '<option value="">-- Quién vende --</option>';
    state.employees.forEach(e => {
      // Filtro opcional: Podríamos filtrar por e.role === 'SALES'
      const opt = document.createElement('option');
      opt.value = e.ID;
      opt.textContent = `${e.firstName} ${e.lastName} (${e.role || 'Staff'})`;
      selSalesPerson.appendChild(opt);
    });
  }

  // 4. Formulario
  function toggleForm(show, mode = 'new', data = null) {
    if (!show) {
      formPanel.classList.add('hidden');
      form.reset();
      return;
    }

    formPanel.classList.remove('hidden');
    checkValidity();

    if (mode === 'new') {
      formTitle.textContent = 'Nuevo Pedido';
      btnSave.textContent = 'Crear Pedido';
      state.isEditing = false;
      form.reset();
      form.elements.id.value = '';
      // Default: Hoy
      form.elements.orderDate.value = new Date().toISOString().slice(0, 10);
      form.elements.status.value = 'ABIERTO';
      if(state.currencies.find(c=>c.code==='CLP')) form.elements.currency_code.value = 'CLP';
    } else {
      formTitle.textContent = 'Editar Pedido';
      btnSave.textContent = 'Guardar Cambios';
      state.isEditing = true;

      form.elements.id.value = data.ID;
      form.elements.orderNo.value = data.orderNo || '';
      form.elements.customer_ID.value = data.customer_ID || '';
      form.elements.salesPerson_ID.value = data.salesPerson_ID || ''; // Cargar vendedor
      form.elements.orderDate.value = data.orderDate ? data.orderDate.slice(0,10) : '';
      form.elements.status.value = data.status || 'ABIERTO';
      form.elements.currency_code.value = data.currency_code || '';
      form.elements.totalAmount.value = data.totalAmount || '';
      form.elements.notes.value = data.notes || '';
    }
  }

  function checkValidity() {
    const hasNo = !!form.elements.orderNo.value.trim();
    const hasCust = !!form.elements.customer_ID.value;
    const hasSeller = !!form.elements.salesPerson_ID.value; // Validar Vendedor
    const hasDate = !!form.elements.orderDate.value;
    const hasCurr = !!form.elements.currency_code.value;

    if (hasNo && hasCust && hasSeller && hasDate && hasCurr) {
      btnSave.removeAttribute('disabled');
    } else {
      btnSave.setAttribute('disabled', 'true');
    }
  }

  // --- Event Listeners ---

  host.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortKey = key;
        state.sortDir = 'asc';
      }
      renderTable();
    });
  });

  host.querySelector('#btn-refresh').addEventListener('click', loadData);
  host.querySelector('#btn-new').addEventListener('click', () => toggleForm(true, 'new'));
  host.querySelector('#btn-cancel').addEventListener('click', () => toggleForm(false));
  
  form.addEventListener('input', checkValidity);
  form.addEventListener('change', checkValidity);

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const formData = new FormData(form);

    const payload = {
      orderNo: formData.get('orderNo').trim(),
      customer_ID: formData.get('customer_ID'),
      salesPerson_ID: formData.get('salesPerson_ID'), // Enviar Vendedor
      orderDate: formData.get('orderDate'),
      status: formData.get('status'),
      currency_code: formData.get('currency_code'),
      totalAmount: parseFloat(formData.get('totalAmount')) || 0,
      notes: formData.get('notes').trim() || null
    };

    try {
      const id = formData.get('id');
      if (id) {
        await apiUpdate(id, payload);
        showToast('Pedido actualizado');
      } else {
        await apiCreate(payload);
        showToast('Pedido creado exitosamente');
      }
      toggleForm(false);
      loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });

  tbody.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;

    // Acción SUBMIT (Confirmar Venta)
    if (action === 'submit') {
      if (confirm('¿Confirmar venta? Se descontará el stock y no podrá editarse.')) {
        try {
          await apiSubmitOrder(id);
          showToast('✅ Venta confirmada y Stock descontado');
          loadData();
        } catch (err) { alert('Error: ' + err.message); }
      }
    } 
    else if (action === 'edit') {
      const item = state.list.find(x => x.ID === id);
      if (item) toggleForm(true, 'edit', item);
    } 
    else if (action === 'delete') {
      if (confirm('¿Eliminar este pedido?')) {
        try {
          await apiDelete(id);
          showToast('Pedido eliminado');
          loadData();
          if (form.elements.id.value === id) toggleForm(false);
        } catch (err) {
          alert('Error: ' + err.message);
        }
      }
    }
  });

  loadData();
}

// --- Helpers ---

function escapeHtml(text) {
  if (!text) return '';
  return text.toString().replace(/</g, "&lt;");
}

function formatDate(isoDate) {
  if (!isoDate) return '-';
  return isoDate.slice(0, 10);
}

function showToast(msg) {
  const div = document.createElement('div');
  div.className = 'toast-success';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// API
async function apiCreate(data) {
  const res = await fetch(API_ORDERS, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
}
async function apiUpdate(id, data) {
  const res = await fetch(`${API_ORDERS}/${id}`, {
    method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
}
async function apiDelete(id) {
  const res = await fetch(`${API_ORDERS}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
}

// Acción Bound Submit
async function apiSubmitOrder(id) {
  const res = await fetch(`${API_ORDERS}/${id}/CatalogService.submit`, {
    method: 'POST', 
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify({})
  });
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error?.message || 'Error al confirmar');
  }
}