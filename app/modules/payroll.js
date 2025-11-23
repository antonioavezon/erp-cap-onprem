// app/modules/payroll.js
// Módulo Remuneraciones – Cálculo de Nómina

export const title = 'Remuneraciones y Nómina';

const API_PAYROLLS  = '/catalog/Payrolls';
const API_EMPLOYEES = '/catalog/Employees';
const CSS_PATH      = './modules/payroll.css';

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
    employees: [],
    sortKey: 'period',
    sortDir: 'desc',
    isEditing: false
  };

  // --- HTML ---
  host.innerHTML = `
    <div class="pay-module">
      
      <header class="pay-header">
        <div class="pay-actions">
          <button type="button" class="btn ghost" id="btn-refresh">🔄 Actualizar</button>
          <button type="button" class="btn primary" id="btn-new">+ Procesar Liquidación</button>
        </div>
      </header>

      <div class="pay-body">
        
        <section class="pay-list">
          <div class="table-container">
            <table class="pay-table">
              <thead>
                <tr>
                  <th data-sort="period">Periodo <span class="sort-icon"></span></th>
                  <th data-sort="employee_ID">Colaborador <span class="sort-icon"></span></th>
                  <th data-sort="baseSalary">Base <span class="sort-icon"></span></th>
                  <th data-sort="totalLiquid">A Pagar (Líquido) <span class="sort-icon"></span></th>
                  <th data-sort="isPaid">Estado <span class="sort-icon"></span></th>
                  <th style="width: 100px; text-align:center;">Acciones</th>
                </tr>
              </thead>
              <tbody id="pay-table-body">
                <tr><td colspan="6" style="text-align:center; padding:30px; color:#888;">Cargando nómina...</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="pay-form-panel" class="pay-form-wrapper hidden">
          <header class="pay-form-header">
            <h3 id="form-title">Procesar Liquidación</h3>
          </header>
          
          <form id="pay-form" class="pay-form" autocomplete="off">
            <input type="hidden" name="id" />

            <div class="form-grid">
              
              <div class="form-group">
                <label>Periodo (Mes) *</label>
                <input name="period" type="month" required />
              </div>

              <div class="form-group">
                <label>Colaborador *</label>
                <select name="employee_ID" required>
                  <option value="">Seleccionar...</option>
                </select>
              </div>

              <div class="form-section-title">Haberes (Ingresos)</div>

              <div class="form-group">
                <label>Sueldo Base</label>
                <input name="baseSalary" type="number" min="0" step="0.01" placeholder="0" required />
              </div>

              <div class="form-group">
                <label>Bonos / Gratificación</label>
                <input name="bonuses" type="number" min="0" step="0.01" placeholder="0" />
              </div>

              <div class="form-group">
                <label>Monto Horas Extra</label>
                <input name="overtimeAmount" type="number" min="0" step="0.01" placeholder="0" />
              </div>

              <div class="form-group">
                <label>Cant. HHEE (Ref)</label>
                <input name="overtimeHours" type="number" min="0" step="0.5" placeholder="0" style="background:#f9f9f9" />
              </div>

              <div class="form-section-title" style="color:#c62828;">Descuentos (Egresos)</div>

              <div class="form-group full-width">
                <label>Total Descuentos (AFP, Salud, Impuesto)</label>
                <input name="discounts" type="number" min="0" step="0.01" placeholder="0" style="color:#c62828;" />
              </div>

              <div class="form-section-title">Total a Pagar</div>

              <div class="form-group full-width">
                <label>Sueldo Líquido (Calculado)</label>
                <input name="totalLiquid" type="number" readonly style="font-size:1.1rem; color:#0056b3;" />
              </div>

              <div class="form-group full-width">
                 <div class="form-check">
                    <input type="checkbox" id="chk-paid" name="isPaid" />
                    <label for="chk-paid">Marcar como PAGADO</label>
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

  const tbody = host.querySelector('#pay-table-body');
  const formPanel = host.querySelector('#pay-form-panel');
  const form = host.querySelector('#pay-form');
  const formTitle = host.querySelector('#form-title');
  const btnSave = host.querySelector('#btn-save');
  const selEmployee = form.elements.employee_ID;

  // --- LÓGICA ---

  async function loadData() {
    try {
      // Expandimos employee para ver el nombre en la tabla
      const [resPay, resEmp] = await Promise.all([
        fetch(`${API_PAYROLLS}?$expand=employee&$orderby=period desc`),
        fetch(`${API_EMPLOYEES}?$orderby=lastName asc`)
      ]);

      const dPay = await resPay.json();
      const dEmp = await resEmp.json();

      state.list = dPay.value || [];
      state.employees = dEmp.value || [];

      renderTable();
      updateSelects();
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Error al cargar nómina</td></tr>`;
    }
  }

  function renderTable() {
    const sorted = [...state.list].sort((a, b) => {
      let valA = a[state.sortKey] || '';
      let valB = b[state.sortKey] || '';
      
      if (valA < valB) return state.sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return state.sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    tbody.innerHTML = '';
    if (sorted.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#888;">No hay liquidaciones registradas.</td></tr>`;
      return;
    }

    sorted.forEach(p => {
      const empName = p.employee ? `${p.employee.lastName}, ${p.employee.firstName}` : 'Desconocido';
      const baseFmt = formatMoney(p.baseSalary);
      const liquidFmt = formatMoney(p.totalLiquid);
      
      const statusBadge = p.isPaid 
        ? `<span class="status-paid">Pagado</span>` 
        : `<span class="status-pending">Pendiente</span>`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(p.period)}</strong></td>
        <td>${escapeHtml(empName)}</td>
        <td class="money-plus">${baseFmt}</td>
        <td class="money-total">${liquidFmt}</td>
        <td style="text-align:center;">${statusBadge}</td>
        <td style="text-align:center;">
          <button class="btn tiny" data-action="edit" data-id="${p.ID}">✏️</button>
          <button class="btn tiny danger" data-action="delete" data-id="${p.ID}">🗑️</button>
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
    selEmployee.innerHTML = '<option value="">-- Seleccionar --</option>';
    state.employees.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.ID;
      opt.textContent = `${e.lastName} ${e.firstName} (${e.rut})`;
      selEmployee.appendChild(opt);
    });
  }

  // --- CÁLCULO AUTOMÁTICO ---
  function autoCalculate() {
    const base = parseFloat(form.elements.baseSalary.value) || 0;
    const bonuses = parseFloat(form.elements.bonuses.value) || 0;
    const overtime = parseFloat(form.elements.overtimeAmount.value) || 0;
    const discounts = parseFloat(form.elements.discounts.value) || 0;

    const liquid = (base + bonuses + overtime) - discounts;
    form.elements.totalLiquid.value = liquid.toFixed(2);
  }

  function toggleForm(show, mode = 'new', data = null) {
    if (!show) { formPanel.classList.add('hidden'); form.reset(); return; }
    formPanel.classList.remove('hidden');
    
    if (mode === 'new') {
      formTitle.textContent = 'Nueva Liquidación';
      btnSave.textContent = 'Procesar';
      state.isEditing = false;
      form.reset();
      form.elements.id.value = '';
      // Default Periodo Actual
      const now = new Date();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      form.elements.period.value = `${now.getFullYear()}-${month}`;
    } else {
      formTitle.textContent = 'Editar Liquidación';
      btnSave.textContent = 'Actualizar';
      state.isEditing = true;
      
      form.elements.id.value = data.ID;
      form.elements.period.value = data.period || '';
      form.elements.employee_ID.value = data.employee_ID || '';
      form.elements.baseSalary.value = data.baseSalary || '';
      form.elements.bonuses.value = data.bonuses || '';
      form.elements.overtimeAmount.value = data.overtimeAmount || '';
      form.elements.overtimeHours.value = data.overtimeHours || '';
      form.elements.discounts.value = data.discounts || '';
      form.elements.totalLiquid.value = data.totalLiquid || '';
      form.elements.isPaid.checked = !!data.isPaid;
    }
    checkValidity();
  }

  function checkValidity() {
    const hasPeriod = !!form.elements.period.value;
    const hasEmp = !!form.elements.employee_ID.value;
    
    if (hasPeriod && hasEmp) {
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
  
  form.addEventListener('input', () => {
    autoCalculate(); // Calcular siempre al escribir
    checkValidity();
  });
  form.addEventListener('change', checkValidity);

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const formData = new FormData(form);
    
    const payload = {
      period: formData.get('period'),
      employee_ID: formData.get('employee_ID'),
      baseSalary: parseFloat(formData.get('baseSalary')) || 0,
      bonuses: parseFloat(formData.get('bonuses')) || 0,
      overtimeAmount: parseFloat(formData.get('overtimeAmount')) || 0,
      overtimeHours: parseFloat(formData.get('overtimeHours')) || 0,
      discounts: parseFloat(formData.get('discounts')) || 0,
      totalLiquid: parseFloat(formData.get('totalLiquid')) || 0,
      isPaid: form.elements.isPaid.checked
    };

    try {
      const id = formData.get('id');
      if (id) {
        await apiUpdate(id, payload);
        showToast('Liquidación actualizada');
      } else {
        await apiCreate(payload);
        showToast('Liquidación procesada');
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
      if (confirm('¿Eliminar registro de nómina?')) {
        try {
          await apiDelete(id);
          showToast('Registro eliminado');
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
function formatMoney(val) {
  if (val == null) return '-';
  return '$' + Number(val).toLocaleString('es-CL', {minimumFractionDigits: 0});
}
function showToast(msg) {
  const div = document.createElement('div');
  div.className = 'toast-success';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}
async function apiCreate(data) {
  const res = await fetch(API_PAYROLLS, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  if (!res.ok) throw new Error(await res.text());
}
async function apiUpdate(id, data) {
  const res = await fetch(`${API_PAYROLLS}/${id}`, {method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  if (!res.ok) throw new Error(await res.text());
}
async function apiDelete(id) {
  const res = await fetch(`${API_PAYROLLS}/${id}`, {method: 'DELETE'});
  if (!res.ok) throw new Error(await res.text());
}