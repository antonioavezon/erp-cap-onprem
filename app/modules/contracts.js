// app/modules/contracts.js
// Módulo Contratos – Datos Legales y Bancarios

export const title = 'Contratos y Datos Legales';

const API_CONTRACTS = '/catalog/Contracts';
const API_EMPLOYEES = '/catalog/Employees';
const API_CURRENCIES = '/catalog/Currencies';
const CSS_PATH = './modules/contracts.css';

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
    employees: [], // Para el dropdown
    currencies: [],
    sortKey: 'startDate',
    sortDir: 'desc',
    isEditing: false
  };

  // --- HTML ---
  host.innerHTML = `
    <div class="cnt-module">
      
      <header class="cnt-header">
        <div class="cnt-actions">
          <button type="button" class="btn ghost" id="btn-refresh">🔄 Actualizar</button>
          <button type="button" class="btn primary" id="btn-new">+ Nuevo Contrato</button>
        </div>
      </header>

      <div class="cnt-body">
        
        <section class="cnt-list">
          <div class="table-container">
            <table class="cnt-table">
              <thead>
                <tr>
                  <th data-sort="employee_ID">Colaborador <span class="sort-icon"></span></th>
                  <th data-sort="startDate">Inicio <span class="sort-icon"></span></th>
                  <th data-sort="endDate">Fin <span class="sort-icon"></span></th>
                  <th data-sort="baseSalary">Sueldo Base <span class="sort-icon"></span></th>
                  <th data-sort="afp">Previsión <span class="sort-icon"></span></th>
                  <th>Estado</th>
                  <th style="width: 100px; text-align:center;">Acciones</th>
                </tr>
              </thead>
              <tbody id="cnt-table-body">
                <tr><td colspan="7" style="text-align:center; padding:30px; color:#888;">Cargando contratos...</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="cnt-form-panel" class="cnt-form-wrapper hidden">
          <header class="cnt-form-header">
            <h3 id="form-title">Contrato Laboral</h3>
          </header>
          
          <form id="cnt-form" class="cnt-form" autocomplete="off">
            <input type="hidden" name="id" />

            <div class="form-grid">
              
              <div class="form-group full-width">
                <label>Colaborador *</label>
                <select name="employee_ID" required>
                  <option value="">Cargando lista...</option>
                </select>
              </div>

              <div class="form-group">
                <label>Fecha Inicio *</label>
                <input name="startDate" type="date" required />
              </div>

              <div class="form-group">
                <label>Fecha Término (Opcional)</label>
                <input name="endDate" type="date" />
              </div>

              <div class="form-section-title">Remuneración</div>

              <div class="form-group">
                <label>Sueldo Base *</label>
                <input name="baseSalary" type="number" min="0" required />
              </div>

              <div class="form-group">
                <label>Moneda *</label>
                <select name="currency_code" required>
                  <option value="">...</option>
                </select>
              </div>

              <div class="form-section-title">Previsión y Salud</div>

              <div class="form-group">
                <label>AFP *</label>
                <input name="afp" placeholder="Ej: Modelo, Capital" required maxlength="50" />
              </div>

              <div class="form-group">
                <label>Salud (Isapre/Fonasa) *</label>
                <input name="healthSystem" placeholder="Ej: Fonasa C" required maxlength="50" />
              </div>

              <div class="form-section-title">Datos Bancarios</div>

              <div class="form-group full-width">
                <label>Banco</label>
                <input name="bankName" placeholder="Ej: Banco Estado" maxlength="50" />
              </div>

              <div class="form-group">
                <label>Tipo Cuenta</label>
                <select name="accountType">
                  <option value="VISTA">Vista / RUT</option>
                  <option value="CORRIENTE">Corriente</option>
                  <option value="AHORRO">Ahorro</option>
                </select>
              </div>

              <div class="form-group">
                <label>N° Cuenta</label>
                <input name="bankAccount" maxlength="50" />
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

  const tbody = host.querySelector('#cnt-table-body');
  const formPanel = host.querySelector('#cnt-form-panel');
  const form = host.querySelector('#cnt-form');
  const formTitle = host.querySelector('#form-title');
  const btnSave = host.querySelector('#btn-save');
  const selEmployee = form.elements.employee_ID;
  const selCurrency = form.elements.currency_code;

  // --- LÓGICA ---

  async function loadData() {
    try {
      // Usamos $expand=employee para traer el nombre del colaborador directamente
      const [resContracts, resEmp, resCur] = await Promise.all([
        fetch(`${API_CONTRACTS}?$expand=employee&$orderby=startDate desc`),
        fetch(`${API_EMPLOYEES}?$orderby=lastName asc`),
        fetch(`${API_CURRENCIES}?$orderby=code asc`)
      ]);

      const dCont = await resContracts.json();
      const dEmp = await resEmp.json();
      const dCur = await resCur.json();

      state.list = dCont.value || [];
      state.employees = dEmp.value || [];
      state.currencies = dCur.value || [];

      renderTable();
      updateSelects();
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Error al cargar</td></tr>`;
    }
  }

  function renderTable() {
    const sorted = [...state.list].sort((a, b) => {
      // Lógica simple de ordenamiento
      let valA = a[state.sortKey];
      let valB = b[state.sortKey];
      if (!valA) valA = ''; if (!valB) valB = '';
      
      if (valA < valB) return state.sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return state.sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    tbody.innerHTML = '';
    if (sorted.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#888;">No hay contratos registrados.</td></tr>`;
      return;
    }

    sorted.forEach(c => {
      // Datos expandidos
      const empName = c.employee ? `${c.employee.firstName} ${c.employee.lastName}` : 'Sin Asignar';
      const salaryFmt = c.baseSalary ? `$${Number(c.baseSalary).toLocaleString()} ${c.currency_code}` : '-';
      
      // Estado (Vigente si no tiene fecha fin o fecha fin es futura)
      const now = new Date();
      const endD = c.endDate ? new Date(c.endDate) : null;
      const isActive = !endD || endD >= now;
      const statusBadge = isActive 
        ? `<span class="status-active">Vigente</span>` 
        : `<span class="status-ended">Finalizado</span>`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(empName)}</strong></td>
        <td>${formatDate(c.startDate)}</td>
        <td>${formatDate(c.endDate)}</td>
        <td>${salaryFmt}</td>
        <td>${escapeHtml(c.afp)} / ${escapeHtml(c.healthSystem)}</td>
        <td style="text-align:center;">${statusBadge}</td>
        <td style="text-align:center;">
          <button class="btn tiny" data-action="edit" data-id="${c.ID}">✏️</button>
          <button class="btn tiny danger" data-action="delete" data-id="${c.ID}">🗑️</button>
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
    // Empleados
    selEmployee.innerHTML = '<option value="">-- Seleccionar Colaborador --</option>';
    state.employees.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.ID;
      opt.textContent = `${e.lastName}, ${e.firstName} (${e.rut})`;
      selEmployee.appendChild(opt);
    });

    // Monedas
    selCurrency.innerHTML = '<option value="">Moneda</option>';
    state.currencies.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.code;
      opt.textContent = c.code;
      selCurrency.appendChild(opt);
    });
  }

  function toggleForm(show, mode = 'new', data = null) {
    if (!show) { formPanel.classList.add('hidden'); form.reset(); return; }
    formPanel.classList.remove('hidden');
    checkValidity();

    if (mode === 'new') {
      formTitle.textContent = 'Nuevo Contrato';
      btnSave.textContent = 'Crear';
      state.isEditing = false;
      form.reset();
      form.elements.id.value = '';
      // Defaults
      if (state.currencies.find(c=>c.code==='CLP')) form.elements.currency_code.value = 'CLP';
      form.elements.startDate.value = new Date().toISOString().slice(0,10);
    } else {
      formTitle.textContent = 'Editar Contrato';
      btnSave.textContent = 'Guardar';
      state.isEditing = true;
      // Fill
      form.elements.id.value = data.ID;
      form.elements.employee_ID.value = data.employee_ID || '';
      form.elements.startDate.value = data.startDate || '';
      form.elements.endDate.value = data.endDate || '';
      form.elements.baseSalary.value = data.baseSalary || '';
      form.elements.currency_code.value = data.currency_code || '';
      form.elements.afp.value = data.afp || '';
      form.elements.healthSystem.value = data.healthSystem || '';
      form.elements.bankName.value = data.bankName || '';
      form.elements.accountType.value = data.accountType || 'VISTA';
      form.elements.bankAccount.value = data.bankAccount || '';
    }
  }

  function checkValidity() {
    const hasEmp = !!form.elements.employee_ID.value;
    const hasStart = !!form.elements.startDate.value;
    const hasSalary = !!form.elements.baseSalary.value;
    
    if (hasEmp && hasStart && hasSalary) {
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
      employee_ID: formData.get('employee_ID'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate') || null,
      baseSalary: parseFloat(formData.get('baseSalary')),
      currency_code: formData.get('currency_code'),
      afp: formData.get('afp'),
      healthSystem: formData.get('healthSystem'),
      bankName: formData.get('bankName'),
      accountType: formData.get('accountType'),
      bankAccount: formData.get('bankAccount')
    };

    try {
      const id = formData.get('id');
      if (id) {
        await apiUpdate(id, payload);
        showToast('Contrato actualizado');
      } else {
        await apiCreate(payload);
        showToast('Contrato creado');
      }
      toggleForm(false);
      loadData();
    } catch (err) { alert('Error: ' + err.message); }
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
      if (confirm('¿Eliminar contrato?')) {
        try {
          await apiDelete(id);
          showToast('Contrato eliminado');
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
function formatDate(iso) {
  if (!iso) return '-';
  return iso.slice(0, 10);
}
function showToast(msg) {
  const div = document.createElement('div');
  div.className = 'toast-success';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}
async function apiCreate(data) {
  const res = await fetch(API_CONTRACTS, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  if (!res.ok) throw new Error(await res.text());
}
async function apiUpdate(id, data) {
  const res = await fetch(`${API_CONTRACTS}/${id}`, {method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  if (!res.ok) throw new Error(await res.text());
}
async function apiDelete(id) {
  const res = await fetch(`${API_CONTRACTS}/${id}`, {method: 'DELETE'});
  if (!res.ok) throw new Error(await res.text());
}