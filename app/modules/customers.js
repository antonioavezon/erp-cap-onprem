// app/modules/customers.js
// Módulo Clientes – Versión Profesional

import { apiFetch } from './utils.js'; // <--- FETCH SEGURO

export const title = 'Clientes';

const API_ROOT = '/catalog/Customers';
const CSS_PATH = './modules/customers.css'; 

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
    sortKey: 'createdAt',
    sortDir: 'desc',
    isEditing: false
  };

  host.innerHTML = `
    <div class="cust-module">
      
      <header class="cust-header">
        <div class="cust-actions">
          <button type="button" class="btn ghost" id="btn-refresh" title="Recargar lista">
            🔄 Actualizar
          </button>
          <button type="button" class="btn primary" id="btn-new">
            + Nuevo cliente
          </button>
        </div>
      </header>

      <div class="cust-body">
        
        <section class="cust-list">
          <table class="cust-table">
            <thead>
              <tr>
                <th data-sort="name">Nombre <span class="sort-icon"></span></th>
                <th data-sort="taxNumber">RUT / VAT <span class="sort-icon"></span></th>
                <th data-sort="email">Correo <span class="sort-icon"></span></th>
                <th data-sort="city">Ciudad <span class="sort-icon"></span></th>
                <th data-sort="country_code">País <span class="sort-icon"></span></th>
                <th data-sort="isActive">Activo <span class="sort-icon"></span></th>
                <th style="width: 100px; text-align:center;">Acciones</th>
              </tr>
            </thead>
            <tbody id="cust-table-body">
              <tr>
                <td colspan="7" style="text-align:center; padding:20px; color:#666;">
                  Cargando datos...
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section id="cust-form-panel" class="cust-form-wrapper hidden">
          <header class="cust-form-header">
            <h3 id="form-title">Nuevo Cliente</h3>
          </header>
          
          <form id="cust-form" class="cust-form" autocomplete="off">
            <input type="hidden" name="id" />

            <div class="form-grid">
              <div class="form-group">
                <label>Nombre *</label>
                <input name="name" required maxlength="120" placeholder="Ej: Empresa Demo S.A." />
              </div>
              <div class="form-group">
                <label>RUT / VAT / NIF</label>
                <input name="taxNumber" maxlength="30" />
              </div>
              <div class="form-group">
                <label>Correo electrónico</label>
                <input name="email" type="email" maxlength="120" />
              </div>
              <div class="form-group">
                <label>Teléfono</label>
                <input name="phone" maxlength="30" />
              </div>
              <div class="form-group">
                <label>Calle y número</label>
                <input name="street" maxlength="120" />
              </div>
              <div class="form-group">
                <label>Ciudad</label>
                <input name="city" maxlength="80" />
              </div>
              <div class="form-group">
                <label>Código postal</label>
                <input name="postalCode" maxlength="20" />
              </div>
              <div class="form-group">
                <label>País (ISO 2 letras)</label>
                <input name="country_code" maxlength="3" placeholder="Ej: CL, AR, US" />
              </div>
              <div class="form-check">
                <input type="checkbox" id="chk-active" name="isActive" checked />
                <label for="chk-active" style="cursor:pointer;">Cliente activo</label>
              </div>
            </div>

            <div class="form-footer">
              <button type="button" class="btn-full btn-secondary" id="btn-cancel">Cancelar</button>
              <button type="submit" class="btn-full btn-primary" id="btn-save" disabled>Crear</button>
            </div>
          </form>
        </section>

      </div>
    </div>
  `;

  const tbody = host.querySelector('#cust-table-body');
  const formPanel = host.querySelector('#cust-form-panel');
  const form = host.querySelector('#cust-form');
  const formTitle = host.querySelector('#form-title');
  const btnSave = host.querySelector('#btn-save');

  async function loadData() {
    try {
      // USAR APIFETCH
      const res = await apiFetch(`${API_ROOT}?$orderby=createdAt desc`);
      const data = await res.json();
      state.list = data.value || [];
      renderTable();
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Error al cargar datos</td></tr>`;
    }
  }

  function renderTable() {
    const sortedList = [...state.list].sort((a, b) => {
      const valA = (a[state.sortKey] || '').toString().toLowerCase();
      const valB = (b[state.sortKey] || '').toString().toLowerCase();
      if (valA < valB) return state.sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return state.sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    tbody.innerHTML = '';
    if (sortedList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#888;">No hay clientes registrados todavía.</td></tr>`;
      return;
    }

    sortedList.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(c.name)}</strong></td>
        <td>${escapeHtml(c.taxNumber)}</td>
        <td>${escapeHtml(c.email)}</td>
        <td>${escapeHtml(c.city)}</td>
        <td>${escapeHtml(c.country_code)}</td>
        <td>${c.isActive ? '<span style="color:green; font-weight:bold;">Sí</span>' : '<span style="color:#ccc;">No</span>'}</td>
        <td style="text-align:center;">
          <button class="btn tiny" data-action="edit" data-id="${c.ID}" title="Editar">✏️</button>
          <button class="btn tiny danger" data-action="delete" data-id="${c.ID}" title="Eliminar">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    updateHeaderIcons();
  }

  function updateHeaderIcons() {
    host.querySelectorAll('th[data-sort]').forEach(th => {
      const key = th.dataset.sort;
      const iconSpan = th.querySelector('.sort-icon');
      if (key === state.sortKey) {
        iconSpan.textContent = state.sortDir === 'asc' ? ' ▲' : ' ▼';
        th.style.backgroundColor = '#cce4ff';
      } else {
        iconSpan.textContent = '';
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
      formTitle.textContent = 'Nuevo Cliente';
      btnSave.textContent = 'Crear';
      state.isEditing = false;
      form.reset();
      form.elements.id.value = '';
      form.elements.isActive.checked = true;
    } else {
      formTitle.textContent = 'Editar Cliente';
      btnSave.textContent = 'Guardar Cambios';
      state.isEditing = true;
      
      form.elements.id.value = data.ID;
      form.elements.name.value = data.name || '';
      form.elements.taxNumber.value = data.taxNumber || '';
      form.elements.email.value = data.email || '';
      form.elements.phone.value = data.phone || '';
      form.elements.street.value = data.street || '';
      form.elements.city.value = data.city || '';
      form.elements.postalCode.value = data.postalCode || '';
      form.elements.country_code.value = data.country_code || '';
      form.elements.isActive.checked = !!data.isActive;
    }
  }

  function checkValidity() {
    const nameVal = form.elements.name.value.trim();
    if (nameVal.length > 0) {
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

  host.querySelector('#btn-new').addEventListener('click', () => toggleForm(true, 'new'));
  host.querySelector('#btn-refresh').addEventListener('click', loadData);
  host.querySelector('#btn-cancel').addEventListener('click', () => toggleForm(false));
  form.addEventListener('input', checkValidity);

  tbody.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button[data-action]');
    if (!btn) return;
    
    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === 'edit') {
      const item = state.list.find(x => x.ID === id);
      if (item) toggleForm(true, 'edit', item);
    } 
    else if (action === 'delete') {
      if(confirm('¿Eliminar cliente?')) {
        try {
          await apiDelete(id);
          showToast('Cliente eliminado correctamente');
          loadData();
          if (form.elements.id.value === id) toggleForm(false);
        } catch (err) {
          alert('Error al eliminar: ' + err.message);
        }
      }
    }
  });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const formData = new FormData(form);
    
    const payload = {
      name: formData.get('name'),
      taxNumber: formData.get('taxNumber'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      street: formData.get('street'),
      city: formData.get('city'),
      postalCode: formData.get('postalCode'),
      country_code: formData.get('country_code'),
      isActive: form.elements.isActive.checked
    };

    try {
      const id = formData.get('id');
      if (id) {
        await apiUpdate(id, payload);
        showToast('Cliente actualizado con éxito');
      } else {
        await apiCreate(payload);
        showToast('Cliente creado con éxito');
      }
      toggleForm(false); 
      loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });

  loadData();
}

// --- HELPERS ---

function escapeHtml(text) {
  if (!text) return '';
  return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function showToast(msg) {
  const div = document.createElement('div');
  div.className = 'toast-success';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// --- API Fetchers SEGUROS ---

async function apiCreate(data) {
  // USAR APIFETCH
  const res = await apiFetch(API_ROOT, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
}

async function apiUpdate(id, data) {
  // USAR APIFETCH
  const res = await apiFetch(`${API_ROOT}/${id}`, {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
}

async function apiDelete(id) {
  // USAR APIFETCH
  const res = await apiFetch(`${API_ROOT}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
}