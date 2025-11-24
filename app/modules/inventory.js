// app/modules/inventory.js
// Módulo Inventario – Control de Stock y Movimientos

import { apiFetch } from './utils.js'; // <--- FETCH SEGURO

export const title = 'Inventario y Stock';

const API_PRODUCTS  = '/catalog/Products';
const API_MOVEMENTS = '/catalog/StockMovements';
const API_EMPLOYEES = '/catalog/Employees'; // Cargar responsables
const CSS_PATH      = './modules/inventory.css';

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
    products: [],
    employees: [], // Lista de empleados
    sortKey: 'name',
    sortDir: 'asc',
    isFormVisible: false
  };

  // --- HTML Template ---
  host.innerHTML = `
    <div class="inv-module">
      
      <header class="inv-header">
        <div class="inv-actions">
          <button type="button" class="btn ghost" id="btn-refresh" title="Recargar Stock">
            🔄 Actualizar
          </button>
          <button type="button" class="btn primary" id="btn-move">
            📦 Ajustar Stock
          </button>
        </div>
      </header>

      <div class="inv-body">
        
        <section class="inv-list">
          <div class="table-container">
            <table class="inv-table">
              <thead>
                <tr>
                  <th data-sort="name">Producto <span class="sort-icon"></span></th>
                  <th data-sort="sku">SKU <span class="sort-icon"></span></th>
                  <th data-sort="price">Precio <span class="sort-icon"></span></th>
                  <th data-sort="stock">Stock Actual <span class="sort-icon"></span></th>
                  <th style="text-align:center;">Estado</th>
                </tr>
              </thead>
              <tbody id="inv-table-body">
                <tr><td colspan="5" style="text-align:center; padding:30px; color:#888;">Cargando inventario...</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="inv-form-panel" class="inv-form-wrapper hidden">
          <header class="inv-form-header">
            <h3>Registrar Movimiento</h3>
          </header>
          
          <form id="inv-form" class="inv-form" autocomplete="off">
            <div class="form-grid">
              
              <div class="form-group">
                <label>Tipo de Movimiento</label>
                <select name="type" required>
                  <option value="IN">⬇️ ENTRADA (Compra/Dev)</option>
                  <option value="OUT">⬆️ SALIDA (Merma/Ajuste)</option>
                </select>
              </div>

              <div class="form-group">
                <label>Responsable *</label>
                <select name="responsible_ID" required>
                  <option value="">Cargando personal...</option>
                </select>
              </div>

              <div class="form-group full-width">
                <label>Producto *</label>
                <select name="product_ID" required>
                  <option value="">Cargando productos...</option>
                </select>
              </div>

              <div class="form-group">
                <label>Cantidad *</label>
                <input name="quantity" type="number" min="1" step="1" required placeholder="0" />
              </div>

              <div class="form-group">
                <label>Referencia / Nota *</label>
                <input name="reference" maxlength="50" placeholder="Ej: Ajuste inventario" required />
              </div>

            </div>

            <div class="form-actions">
              <button type="button" class="btn secondary btn-full" id="btn-cancel">Cancelar</button>
              <button type="submit" class="btn primary btn-full" id="btn-save" disabled>Registrar</button>
            </div>
            
            <p style="font-size:0.8rem; color:#666; margin-top:15px; line-height:1.4;">
              <strong>Nota:</strong> Las entradas suman al stock. Las salidas restan. 
              El responsable quedará registrado en el historial (Kardex).
            </p>
          </form>
        </section>

      </div>
    </div>
  `;

  const tbody = host.querySelector('#inv-table-body');
  const formPanel = host.querySelector('#inv-form-panel');
  const form = host.querySelector('#inv-form');
  const btnSave = host.querySelector('#btn-save');
  const selProduct = form.elements.product_ID;
  const selResponsible = form.elements.responsible_ID;

  // --- LÓGICA ---

  async function loadData() {
    try {
      // Carga paralela segura
      const [resProd, resEmp] = await Promise.all([
        apiFetch(`${API_PRODUCTS}?$orderby=name asc`),
        apiFetch(`${API_EMPLOYEES}?$orderby=lastName asc`)
      ]);

      const dataProd = await resProd.json();
      const dataEmp = await resEmp.json();

      state.products = dataProd.value || [];
      state.employees = dataEmp.value || [];
      
      renderTable();
      updateSelects();
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Error al cargar datos</td></tr>`;
    }
  }

  function renderTable() {
    const sortedList = [...state.products].sort((a, b) => {
      let valA = a[state.sortKey];
      let valB = b[state.sortKey];

      if (state.sortKey === 'stock' || state.sortKey === 'price') {
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
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px; color:#888;">No hay productos definidos.</td></tr>`;
      return;
    }

    sortedList.forEach(p => {
      const stock = p.stock || 0;
      let badgeClass = 'stock-high';
      let statusText = 'OK';

      if (stock <= 0) {
        badgeClass = 'stock-crit';
        statusText = 'Sin Stock';
      } else if (stock < 10) {
        badgeClass = 'stock-low';
        statusText = 'Bajo';
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td><span style="font-family:monospace; color:#555;">${escapeHtml(p.sku)}</span></td>
        <td>$${Number(p.price).toLocaleString('es-CL')}</td>
        <td style="font-weight:bold; font-size:1rem;">${stock}</td>
        <td style="text-align:center;">
          <span class="badge-stock ${badgeClass}">${statusText}</span>
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

  function updateSelects() {
    // Productos
    const currentProd = selProduct.value;
    selProduct.innerHTML = '<option value="">-- Seleccionar Producto --</option>';
    state.products.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.ID;
      opt.textContent = `${p.name} (Stock: ${p.stock || 0})`;
      selProduct.appendChild(opt);
    });
    selProduct.value = currentProd;

    // Responsables
    const currentResp = selResponsible.value;
    selResponsible.innerHTML = '<option value="">-- Quién Ajusta --</option>';
    state.employees.forEach(e => {
      if (e.isActive) {
        const roleTxt = e.role === 'WAREHOUSE' ? ' (Bodega)' : (e.role === 'ADMIN' ? ' (Admin)' : '');
        const opt = document.createElement('option');
        opt.value = e.ID;
        opt.textContent = `${e.firstName} ${e.lastName}${roleTxt}`;
        selResponsible.appendChild(opt);
      }
    });
    selResponsible.value = currentResp;
  }

  function toggleForm(show) {
    state.isFormVisible = show;
    if (show) {
      formPanel.classList.remove('hidden');
      form.reset();
      checkValidity();
    } else {
      formPanel.classList.add('hidden');
    }
  }

  function checkValidity() {
    const hasProd = !!form.elements.product_ID.value;
    const hasQty = !!form.elements.quantity.value;
    const hasRef = !!form.elements.reference.value.trim();
    const hasResp = !!form.elements.responsible_ID.value;

    if (hasProd && hasQty && hasRef && hasResp) {
      btnSave.removeAttribute('disabled');
    } else {
      btnSave.setAttribute('disabled', 'true');
    }
  }

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
  host.querySelector('#btn-move').addEventListener('click', () => toggleForm(true));
  host.querySelector('#btn-cancel').addEventListener('click', () => toggleForm(false));
  
  form.addEventListener('input', checkValidity);
  form.addEventListener('change', checkValidity);

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const formData = new FormData(form);
    
    const prodId = formData.get('product_ID');
    const type = formData.get('type');
    const qty = parseInt(formData.get('quantity'));
    const ref = formData.get('reference');
    const respId = formData.get('responsible_ID');

    const product = state.products.find(p => p.ID === prodId);
    if (type === 'OUT' && (product.stock || 0) < qty) {
      alert('Error: No hay suficiente stock para realizar esta salida.');
      return;
    }

    try {
      await apiCreateMovement({
        product_ID: prodId,
        type: type,
        quantity: qty,
        reference: ref,
        responsible_ID: respId, // Enviamos el responsable
        date: new Date().toISOString()
      });

      const currentStock = product.stock || 0;
      const newStock = type === 'IN' ? (currentStock + qty) : (currentStock - qty);

      await apiUpdateProductStock(prodId, newStock);

      showToast('Movimiento registrado exitosamente');
      toggleForm(false);
      loadData();

    } catch (err) {
      console.error(err);
      alert('Error al registrar movimiento: ' + err.message);
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

// --- API SEGURO ---
async function apiCreateMovement(data) {
  const res = await apiFetch(API_MOVEMENTS, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
}

async function apiUpdateProductStock(id, newStock) {
  const res = await apiFetch(`${API_PRODUCTS}/${id}`, {
    method: 'PATCH', 
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify({ stock: newStock })
  });
  if (!res.ok) throw new Error(await res.text());
}