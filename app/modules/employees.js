// app/modules/employees.js
// Módulo Colaboradores (Staff Directory)

export const title = 'Ficha de Colaboradores';

const API_ROOT = '/catalog/Employees';
const CSS_PATH = './modules/employees.css';

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
    sortKey: 'lastName',
    sortDir: 'asc',
    isEditing: false
  };

  // --- HTML ---
  host.innerHTML = `
    <div class="emp-module">
      
      <header class="emp-header">
        <div class="emp-actions">
          <button type="button" class="btn ghost" id="btn-refresh">🔄 Actualizar</button>
          <button type="button" class="btn primary" id="btn-new">+ Nuevo Colaborador</button>
        </div>
      </header>

      <div class="emp-body">
        
        <section class="emp-list">
          <div class="table-container">
            <table class="emp-table">
              <thead>
                <tr>
                  <th data-sort="firstName">Colaborador <span class="sort-icon"></span></th>
                  <th data-sort="rut">RUT <span class="sort-icon"></span></th>
                  <th data-sort="role">Rol <span class="sort-icon"></span></th>
                  <th data-sort="email">Contacto <span class="sort-icon"></span></th>
                  <th data-sort="isActive">Estado <span class="sort-icon"></span></th>
                  <th style="width: 100px; text-align:center;">Acciones</th>
                </tr>
              </thead>
              <tbody id="emp-table-body">
                <tr><td colspan="6" style="text-align:center; padding:30px; color:#888;">Cargando personal...</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="emp-form-panel" class="emp-form-wrapper hidden">
          <header class="emp-form-header">
            <h3 id="form-title">Nuevo Colaborador</h3>
          </header>
          
          <form id="emp-form" class="emp-form" autocomplete="off">
            <input type="hidden" name="id" />

            <div class="form-grid">
              
              <div class="form-group">
                <label>Nombres *</label>
                <input name="firstName" required maxlength="80" placeholder="Ej: Juan Andrés" />
              </div>

              <div class="form-group">
                <label>Apellidos *</label>
                <input name="lastName" required maxlength="80" placeholder="Ej: Pérez López" />
              </div>

              <div class="form-group">
                <label>RUT (ID Nacional) *</label>
                <input name="rut" required maxlength="20" placeholder="12.345.678-9" />
              </div>

              <div class="form-group">
                <label>Rol en Empresa *</label>
                <select name="role" required>
                  <option value="">Seleccione...</option>
                  <option value="SALES">🛒 Vendedor</option>
                  <option value="WAREHOUSE">📦 Bodeguero</option>
                  <option value="ADMIN">👔 Administrativo</option>
                </select>
              </div>

              <div class="form-group full-width">
                <label>Correo Electrónico</label>
                <input name="email" type="email" maxlength="120" placeholder="usuario@empresa.com" />
              </div>

              <div class="form-group">
                <label>Teléfono</label>
                <input name="phone" maxlength="30" />
              </div>

              <div class="form-group" style="justify-content: flex-end;">
                 <div class="form-check">
                    <input type="checkbox" id="chk-active" name="isActive" checked />
                    <label for="chk-active">Activo</label>
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

  const tbody = host.querySelector('#emp-table-body');
  const formPanel = host.querySelector('#emp-form-panel');
  const form = host.querySelector('#emp-form');
  const formTitle = host.querySelector('#form-title');
  const btnSave = host.querySelector('#btn-save');

  // --- LÓGICA ---

  async function loadData() {
    try {
      const res = await fetch(`${API_ROOT}?$orderby=lastName asc`);
      const data = await res.json();
      state.list = data.value || [];
      renderTable();
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Error al cargar</td></tr>`;
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
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#888;">No hay colaboradores registrados.</td></tr>`;
      return;
    }

    sorted.forEach(emp => {
      const fullName = `${emp.firstName} ${emp.lastName}`;
      const initials = getInitials(emp.firstName, emp.lastName);
      
      // Estilo Rol
      let badgeClass = 'role-admin';
      let roleLabel = emp.role || '-';
      if (emp.role === 'SALES') { badgeClass = 'role-sales'; roleLabel = 'Vendedor'; }
      if (emp.role === 'WAREHOUSE') { badgeClass = 'role-warehouse'; roleLabel = 'Bodeguero'; }
      if (emp.role === 'ADMIN') { badgeClass = 'role-admin'; roleLabel = 'Admin'; }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="display:flex; align-items:center;">
          <div class="avatar-circle">${initials}</div>
          <strong>${escapeHtml(fullName)}</strong>
        </td>
        <td>${escapeHtml(emp.rut)}</td>
        <td><span class="badge-role ${badgeClass}">${roleLabel}</span></td>
        <td>
          <div style="font-size:0.85rem;">${escapeHtml(emp.email)}</div>
          <div style="font-size:0.8rem; color:#666;">${escapeHtml(emp.phone)}</div>
        </td>
        <td>${emp.isActive ? '<span style="color:green;">● Activo</span>' : '<span style="color:#ccc;">○ Inactivo</span>'}</td>
        <td style="text-align:center;">
          <button class="btn tiny" data-action="edit" data-id="${emp.ID}">✏️</button>
          <button class="btn tiny danger" data-action="delete" data-id="${emp.ID}">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    updateHeaderIcons();
  }

  function getInitials(first, last) {
    return (first.charAt(0) + last.charAt(0)).toUpperCase();
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

  function toggleForm(show, mode = 'new', data = null) {
    if (!show) { formPanel.classList.add('hidden'); form.reset(); return; }
    formPanel.classList.remove('hidden');
    checkValidity();

    if (mode === 'new') {
      formTitle.textContent = 'Nuevo Colaborador';
      btnSave.textContent = 'Crear Ficha';
      state.isEditing = false;
      form.reset();
      form.elements.id.value = '';
      form.elements.isActive.checked = true;
    } else {
      formTitle.textContent = 'Editar Ficha';
      btnSave.textContent = 'Guardar Cambios';
      state.isEditing = true;
      
      form.elements.id.value = data.ID;
      form.elements.firstName.value = data.firstName || '';
      form.elements.lastName.value = data.lastName || '';
      form.elements.rut.value = data.rut || '';
      form.elements.role.value = data.role || '';
      form.elements.email.value = data.email || '';
      form.elements.phone.value = data.phone || '';
      form.elements.isActive.checked = !!data.isActive;
    }
  }

  function checkValidity() {
    const hasName = form.elements.firstName.value.trim() && form.elements.lastName.value.trim();
    const hasRut = form.elements.rut.value.trim();
    const hasRole = form.elements.role.value;

    if (hasName && hasRut && hasRole) {
      btnSave.removeAttribute('disabled');
    } else {
      btnSave.setAttribute('disabled', 'true');
    }
  }

  // --- Eventos ---
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
  form.addEventListener('change', checkValidity);

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const formData = new FormData(form);
    const payload = {
      firstName: formData.get('firstName').trim(),
      lastName: formData.get('lastName').trim(),
      rut: formData.get('rut').trim(),
      role: formData.get('role'),
      email: formData.get('email').trim(),
      phone: formData.get('phone').trim(),
      isActive: form.elements.isActive.checked
    };

    try {
      const id = formData.get('id');
      if (id) {
        await apiUpdate(id, payload);
        showToast('Ficha actualizada');
      } else {
        await apiCreate(payload);
        showToast('Colaborador creado');
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

    if (action === 'edit') {
      const item = state.list.find(x => x.ID === id);
      if (item) toggleForm(true, 'edit', item);
    } else if (action === 'delete') {
      if (confirm('¿Eliminar ficha del colaborador?')) {
        try {
          await apiDelete(id);
          showToast('Colaborador eliminado');
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