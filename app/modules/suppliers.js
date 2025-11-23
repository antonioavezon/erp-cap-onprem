// app/modules/suppliers.js
// Módulo Proveedores – CRUD contra /catalog/Suppliers

export const title = 'Proveedores';

const API_ROOT = '/catalog/Suppliers';
const CSS_PATH = './modules/suppliers.css';

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
    sortKey: 'name',
    sortDir: 'asc',
    isEditing: false
  };

  // --- HTML ---
  host.innerHTML = `
    <div class="supp-module">
      
      <header class="supp-header">
        <div class="supp-actions">
          <button type="button" class="btn ghost" id="btn-refresh">🔄 Actualizar</button>
          <button type="button" class="btn primary" id="btn-new">+ Nuevo Proveedor</button>
        </div>
      </header>

      <div class="supp-body">
        
        <section class="supp-list">
          <div class="table-container">
            <table class="supp-table">
              <thead>
                <tr>
                  <th data-sort="name">Razón Social <span class="sort-icon"></span></th>
                  <th data-sort="taxNumber">ID Fiscal <span class="sort-icon"></span></th>
                  <th data-sort="paymentTerms">Pago <span class="sort-icon"></span></th>
                  <th data-sort="currency_code">Moneda <span class="sort-icon"></span></th>
                  <th data-sort="city">Ciudad <span class="sort-icon"></span></th>
                  <th data-sort="isActive">Activo <span class="sort-icon"></span></th>
                  <th style="width: 100px; text-align:center;">Acciones</th>
                </tr>
              </thead>
              <tbody id="supp-table-body">
                <tr><td colspan="7" style="text-align:center; padding:30px; color:#888;">Cargando...</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="supp-form-panel" class="supp-form-wrapper hidden">
          <header class="supp-form-header">
            <h3 id="form-title">Nuevo Proveedor</h3>
          </header>
          
          <form id="supp-form" class="supp-form" autocomplete="off">
            <input type="hidden" name="id" />

            <div class="form-grid">
              
              <div class="form-group full-width">
                <label>Razón Social *</label>
                <input name="name" required maxlength="120" placeholder="Ej: Logística Global SpA" />
              </div>

              <div class="form-group">
                <label>ID Fiscal (RUT/NIF)</label>
                <input name="taxNumber" maxlength="30" />
              </div>

              <div class="form-group">
                <label>Condición de Pago</label>
                <select name="paymentTerms">
                  <option value="CONTADO">Contado</option>
                  <option value="15_DIAS">15 Días</option>
                  <option value="30_DIAS">30 Días</option>
                  <option value="60_DIAS">60 Días</option>
                </select>
              </div>

              <div class="form-group">
                <label>Moneda Preferida</label>
                <input name="currency_code" maxlength="3" placeholder="CLP" style="text-transform: uppercase;" />
              </div>

              <div class="form-group">
                <label>Teléfono</label>
                <input name="phone" maxlength="30" />
              </div>

              <div class="form-group full-width">
                <label>Correo Electrónico</label>
                <input name="email" type="email" maxlength="120" />
              </div>

              <div class="form-group full-width">
                <label>Dirección</label>
                <input name="street" maxlength="120" />
              </div>

              <div class="form-group">
                <label>Ciudad</label>
                <input name="city" maxlength="80" />
              </div>

              <div class="form-group">
                <label>País (ISO)</label>
                <input name="country_code" maxlength="3" placeholder="CL" />
              </div>

              <div class="form-group full-width">
                 <div class="form-check">
                    <input type="checkbox" id="chk-active" name="isActive" checked />
                    <label for="chk-active">Proveedor Activo</label>
                 </div>
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

  const tbody = host.querySelector('#supp-table-body');
  const formPanel = host.querySelector('#supp-form-panel');
  const form = host.querySelector('#supp-form');
  const formTitle = host.querySelector('#form-title');
  const btnSave = host.querySelector('#btn-save');

  // --- LÓGICA ---

  async function loadData() {
    try {
      const res = await fetch(`${API_ROOT}?$orderby=name asc`);
      const data = await res.json();
      state.list = data.value || [];
      renderTable();
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Error al cargar</td></tr>`;
    }
  }

  function renderTable() {
    const sorted = [...state.list].sort((a, b) => {
      const valA = (a[state.sortKey] || '').toString().toLowerCase();
      const valB = (b[state.sortKey] || '').toString().toLowerCase();
      if (valA < valB) return state.sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return state.sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    tbody.innerHTML = '';
    if (sorted.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#888;">No hay proveedores registrados.</td></tr>`;
      return;
    }

    sorted.forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(s.name)}</strong></td>
        <td>${escapeHtml(s.taxNumber)}</td>
        <td>${escapeHtml(s.paymentTerms)}</td>
        <td>${escapeHtml(s.currency_code)}</td>
        <td>${escapeHtml(s.city)}</td>
        <td>${s.isActive ? '<span style="color:green;font-weight:bold;">Sí</span>' : '<span style="color:#ccc;">No</span>'}</td>
        <td style="text-align:center;">
          <button class="btn tiny" data-action="edit" data-id="${s.ID}">✏️</button>
          <button class="btn tiny danger" data-action="delete" data-id="${s.ID}">🗑️</button>
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

  function toggleForm(show, mode = 'new', data = null) {
    if (!show) {
      formPanel.classList.add('hidden');
      form.reset();
      return;
    }
    formPanel.classList.remove('hidden');
    checkValidity();

    if (mode === 'new') {
      formTitle.textContent = 'Nuevo Proveedor';
      btnSave.textContent = 'Crear';
      state.isEditing = false;
      form.reset();
      form.elements.id.value = '';
      form.elements.isActive.checked = true;
    } else {
      formTitle.textContent = 'Editar Proveedor';
      btnSave.textContent = 'Guardar Cambios';
      state.isEditing = true;
      // Fill
      form.elements.id.value = data.ID;
      form.elements.name.value = data.name || '';
      form.elements.taxNumber.value = data.taxNumber || '';
      form.elements.paymentTerms.value = data.paymentTerms || 'CONTADO';
      form.elements.currency_code.value = data.currency_code || '';
      form.elements.phone.value = data.phone || '';
      form.elements.email.value = data.email || '';
      form.elements.street.value = data.street || '';
      form.elements.city.value = data.city || '';
      form.elements.country_code.value = data.country_code || '';
      form.elements.isActive.checked = !!data.isActive;
    }
  }

  function checkValidity() {
    if (form.elements.name.value.trim().length > 0) {
      btnSave.removeAttribute('disabled');
    } else {
      btnSave.setAttribute('disabled', 'true');
    }
  }

  // Eventos
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
      name: formData.get('name').trim(),
      taxNumber: formData.get('taxNumber'),
      paymentTerms: formData.get('paymentTerms'),
      currency_code: formData.get('currency_code').toUpperCase(),
      email: formData.get('email'),
      phone: formData.get('phone'),
      street: formData.get('street'),
      city: formData.get('city'),
      country_code: formData.get('country_code').toUpperCase(),
      isActive: form.elements.isActive.checked
    };

    try {
      const id = formData.get('id');
      if (id) {
        await apiUpdate(id, payload);
        showToast('Proveedor actualizado');
      } else {
        await apiCreate(payload);
        showToast('Proveedor creado');
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

    if (action === 'edit') {
      const item = state.list.find(x => x.ID === id);
      if (item) toggleForm(true, 'edit', item);
    } else if (action === 'delete') {
      if (confirm('¿Eliminar proveedor?')) {
        try {
          await apiDelete(id);
          showToast('Proveedor eliminado');
          loadData();
          if (form.elements.id.value === id) toggleForm(false);
        } catch (err) { alert(err.message); }
      }
    }
  });

  loadData();
}

// Helpers
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
async function apiCreate(data) {
  const res = await fetch(API_ROOT, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  if (!res.ok) throw new Error(await res.text());
}
async function apiUpdate(id, data) {
  const res = await fetch(`${API_ROOT}/${id}`, {method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  if (!res.ok) throw new Error(await res.text());
}
async function apiDelete(id) {
  const res = await fetch(`${API_ROOT}/${id}`, {method: 'DELETE'});
  if (!res.ok) throw new Error(await res.text());
}