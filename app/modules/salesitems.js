// app/modules/salesitems.js
// Módulo Ítems de pedido – Versión Profesional

import { apiFetch } from './utils.js'; // <--- FETCH SEGURO

export const title = 'Ítems de pedido';

const API_ITEMS    = '/catalog/SalesOrderItems';
const API_ORDERS   = '/catalog/SalesOrders';
const API_PRODUCTS = '/catalog/Products';

const CSS_PATH = './modules/salesitems.css';

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
    items: [],
    orders: [],   // Lista de pedidos para el select
    products: [], // Lista de productos para el select
    ordersMap: {},   // Mapa ID -> Numero/Nombre para la tabla
    productsMap: {}, // Mapa ID -> Nombre para la tabla
    sortKey: 'createdAt',
    sortDir: 'desc',
    isEditing: false
  };

  // --- Template HTML ---
  host.innerHTML = `
    <div class="item-module">
      
      <header class="item-header">
        <div class="item-actions">
          <button type="button" class="btn ghost" id="btn-refresh" title="Recargar todo">
            🔄 Actualizar
          </button>
          <button type="button" class="btn primary" id="btn-new">
            + Nueva línea
          </button>
        </div>
      </header>

      <div class="item-body">
        
        <section class="item-list">
          <div class="table-container">
            <table class="item-table">
              <thead>
                <tr>
                  <th data-sort="order_ID">Pedido <span class="sort-icon"></span></th>
                  <th data-sort="product_ID">Producto <span class="sort-icon"></span></th>
                  <th data-sort="quantity">Cant. <span class="sort-icon"></span></th>
                  <th data-sort="unitPrice">Precio U. <span class="sort-icon"></span></th>
                  <th data-sort="lineAmount">Importe <span class="sort-icon"></span></th>
                  <th style="width: 110px; text-align:center;">Acciones</th>
                </tr>
              </thead>
              <tbody id="item-table-body">
                <tr>
                  <td colspan="6" style="text-align:center; padding:30px; color:#888;">
                    Cargando datos...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="item-form-panel" class="item-form-wrapper hidden">
          <header class="item-form-header">
            <h3 id="form-title">Nueva Línea</h3>
          </header>
          
          <form id="item-form" class="item-form" autocomplete="off">
            <input type="hidden" name="id" />

            <div class="form-grid">
              
              <div class="form-group full-width">
                <label>Pedido Asociado</label>
                <select name="order_ID" required>
                  <option value="">Cargando pedidos...</option>
                </select>
              </div>

              <div class="form-group full-width">
                <label>Producto</label>
                <select name="product_ID" required>
                  <option value="">Cargando productos...</option>
                </select>
              </div>

              <div class="form-group">
                <label>Cantidad</label>
                <input name="quantity" type="number" min="1" step="1" required placeholder="1" />
              </div>

              <div class="form-group">
                <label>Precio Unit.</label>
                <input name="unitPrice" type="number" min="0" step="0.01" required placeholder="0.00" />
              </div>

              <div class="form-group full-width">
                <label>Importe Total (Calculado)</label>
                <input name="lineAmount" type="number" readonly placeholder="0.00" />
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

  // Elementos DOM
  const tbody = host.querySelector('#item-table-body');
  const formPanel = host.querySelector('#item-form-panel');
  const form = host.querySelector('#item-form');
  const formTitle = host.querySelector('#form-title');
  const btnSave = host.querySelector('#btn-save');
  
  const selOrder = form.elements.order_ID;
  const selProduct = form.elements.product_ID;

  // ============================================================
  // LÓGICA
  // ============================================================

  // 1. Cargar Datos (Maestros + Ítems)
  async function loadData() {
    try {
      // USAR APIFETCH SEGURO
      const [resItems, resOrders, resProds] = await Promise.all([
        apiFetch(`${API_ITEMS}?$orderby=createdAt desc`),
        apiFetch(`${API_ORDERS}?$orderby=orderNo asc`),
        apiFetch(`${API_PRODUCTS}?$orderby=name asc`)
      ]);

      const dItems = await resItems.json();
      const dOrders = await resOrders.json();
      const dProds = await resProds.json();

      state.items = dItems.value || [];
      state.orders = dOrders.value || [];
      state.products = dProds.value || [];

      // Mapear para acceso rápido en la tabla
      state.ordersMap = {};
      state.orders.forEach(o => {
        state.ordersMap[o.ID] = o.orderNo || `Pedido ${o.ID.substring(0,8)}...`;
      });

      state.productsMap = {};
      state.products.forEach(p => {
        state.productsMap[p.ID] = p.name || 'Producto desconocido';
      });

      renderTable();
      updateSelects(); // Llenar los dropdowns del formulario

    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Error al cargar datos</td></tr>`;
    }
  }

  // 2. Dibujar Tabla
  function renderTable() {
    const sortedList = [...state.items].sort((a, b) => {
      // Ordenar por valores visuales si es posible
      let valA = a[state.sortKey];
      let valB = b[state.sortKey];

      // Si ordenamos por importe, tratar como número
      if (['quantity', 'unitPrice', 'lineAmount'].includes(state.sortKey)) {
         valA = Number(valA || 0);
         valB = Number(valB || 0);
      } else {
         // Strings
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
        <tr><td colspan="6" style="text-align:center; padding:40px; color:#888;">
          No hay líneas de pedido registradas.
        </td></tr>`;
      return;
    }

    sortedList.forEach(it => {
      // Obtener nombres legibles
      const orderName = state.ordersMap[it.order_ID] || it.order_ID;
      const prodName = state.productsMap[it.product_ID] || it.product_ID;
      
      const priceFmt = formatMoney(it.unitPrice);
      const totalFmt = formatMoney(it.lineAmount);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span style="font-weight:bold; color:#0056b3;">${escapeHtml(orderName)}</span></td>
        <td>${escapeHtml(prodName)}</td>
        <td style="text-align:center;">${it.quantity || 0}</td>
        <td style="text-align:right;">${priceFmt}</td>
        <td style="text-align:right; font-weight:bold;">${totalFmt}</td>
        <td style="text-align:center;">
          <button class="btn tiny" data-action="edit" data-id="${it.ID}" title="Editar">✏️</button>
          <button class="btn tiny danger" data-action="delete" data-id="${it.ID}" title="Eliminar">🗑️</button>
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

  // 3. Llenar Selects
  function updateSelects() {
    // Pedidos
    selOrder.innerHTML = '<option value="">-- Seleccione un Pedido --</option>';
    state.orders.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.ID;
      opt.textContent = o.orderNo ? `${o.orderNo} (${o.status || '-'})` : o.ID;
      selOrder.appendChild(opt);
    });

    // Productos
    selProduct.innerHTML = '<option value="">-- Seleccione un Producto --</option>';
    state.products.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.ID;
      const sku = p.sku ? ` [${p.sku}]` : '';
      opt.textContent = `${p.name}${sku} - $${p.price}`;
      selProduct.appendChild(opt);
    });
  }

  // 4. Formulario y Cálculos
  function toggleForm(show, mode = 'new', data = null) {
    if (!show) {
      formPanel.classList.add('hidden');
      form.reset();
      return;
    }

    formPanel.classList.remove('hidden');
    checkValidity();

    if (mode === 'new') {
      formTitle.textContent = 'Nueva Línea';
      btnSave.textContent = 'Agregar';
      state.isEditing = false;
      form.reset();
      form.elements.id.value = '';
    } else {
      formTitle.textContent = 'Editar Línea';
      btnSave.textContent = 'Guardar Cambios';
      state.isEditing = true;

      form.elements.id.value = data.ID;
      form.elements.order_ID.value = data.order_ID || '';
      form.elements.product_ID.value = data.product_ID || '';
      form.elements.quantity.value = data.quantity || '';
      form.elements.unitPrice.value = data.unitPrice || '';
      form.elements.lineAmount.value = data.lineAmount || '';
    }
  }

  function autoCalc() {
    const qty = parseFloat(form.elements.quantity.value) || 0;
    const price = parseFloat(form.elements.unitPrice.value) || 0;
    const total = qty * price;
    form.elements.lineAmount.value = total.toFixed(2);
  }

  function checkValidity() {
    // Regla: Debe tener pedido, producto y cantidad > 0
    const hasOrder = !!form.elements.order_ID.value;
    const hasProd = !!form.elements.product_ID.value;
    const hasQty = (parseFloat(form.elements.quantity.value) || 0) > 0;

    if (hasOrder && hasProd && hasQty) {
      btnSave.removeAttribute('disabled');
    } else {
      btnSave.setAttribute('disabled', 'true');
    }
  }

  // --- Event Listeners ---

  // Ordenar
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

  // Cálculo automático al escribir
  form.elements.quantity.addEventListener('input', () => { autoCalc(); checkValidity(); });
  form.elements.unitPrice.addEventListener('input', () => { autoCalc(); checkValidity(); });
  form.elements.order_ID.addEventListener('change', checkValidity);
  form.elements.product_ID.addEventListener('change', checkValidity);

  // Guardar
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const formData = new FormData(form);

    const payload = {
      order_ID: formData.get('order_ID'),
      product_ID: formData.get('product_ID'),
      quantity: parseInt(formData.get('quantity')),
      unitPrice: parseFloat(formData.get('unitPrice')),
      lineAmount: parseFloat(formData.get('lineAmount'))
    };

    try {
      const id = formData.get('id');
      if (id) {
        await apiUpdate(id, payload);
        showToast('Línea actualizada');
      } else {
        await apiCreate(payload);
        showToast('Línea agregada');
      }
      toggleForm(false);
      loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });

  // Acciones Tabla
  tbody.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'edit') {
      const item = state.items.find(x => x.ID === id);
      if (item) toggleForm(true, 'edit', item);
    } 
    else if (action === 'delete') {
      if (confirm('¿Eliminar esta línea?')) {
        try {
          await apiDelete(id);
          showToast('Línea eliminada');
          loadData();
          if (form.elements.id.value === id) toggleForm(false);
        } catch (err) {
          alert('Error: ' + err.message);
        }
      }
    }
  });

  // Iniciar
  loadData();
}

// --- Helpers ---

function escapeHtml(text) {
  if (!text) return '';
  return text.toString().replace(/</g, "&lt;");
}

function formatMoney(val) {
  if (val == null) return '-';
  return Number(val).toLocaleString('es-CL', { minimumFractionDigits: 2 });
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
  const res = await apiFetch(API_ITEMS, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
}
async function apiUpdate(id, data) {
  const res = await apiFetch(`${API_ITEMS}/${id}`, {
    method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
}
async function apiDelete(id) {
  const res = await apiFetch(`${API_ITEMS}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
}