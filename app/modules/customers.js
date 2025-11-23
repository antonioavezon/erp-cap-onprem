// app/modules/customers.js
// Módulo Clientes – Versión Profesional

export const title = 'Clientes';

const API_ROOT = '/catalog/Customers';
// Ruta al CSS que creamos en el paso anterior
const CSS_PATH = './modules/customers.css'; 

/**
 * Función auxiliar para cargar el CSS dinámicamente
 */
function loadStyles() {
  // Evita cargarlo dos veces si ya existe
  if (!document.querySelector(`link[href="${CSS_PATH}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_PATH;
    document.head.appendChild(link);
  }
}

/**
 * RENDER PRINCIPAL
 */
export function render(host) {
  // 1. Cargar estilos
  loadStyles();

  // 2. Estado local del módulo (para ordenar y guardar datos)
  const state = {
    list: [],
    sortKey: 'createdAt', // orden por defecto
    sortDir: 'desc',
    isEditing: false
  };

  // 3. Inyectar el HTML (Estructura profesional)
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

            <div class="form-footer">
              <button type="button" class="btn-full btn-secondary" id="btn-cancel">Cancelar</button>
              <button type="submit" class="btn-full btn-primary" id="btn-save" disabled>Crear</button>
            </div>
          </form>
        </section>

      </div>
    </div>
  `;

  // 4. Referencias a elementos del DOM (para usarlos en el código)
  const tbody = host.querySelector('#cust-table-body');
  const formPanel = host.querySelector('#cust-form-panel');
  const form = host.querySelector('#cust-form');
  const formTitle = host.querySelector('#form-title');
  const btnSave = host.querySelector('#btn-save');

  // ============================================================
  // LÓGICA INTERNA (Aquí está la magia)
  // ============================================================

  // A) Función para cargar datos desde la API
  async function loadData() {
    try {
      // Hacemos la petición al backend
      const res = await fetch(`${API_ROOT}?$orderby=createdAt desc`);
      const data = await res.json();
      
      // Guardamos los datos en el estado local
      state.list = data.value || [];
      
      // Dibujamos la tabla
      renderTable();
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Error al cargar datos</td></tr>`;
    }
  }

  // B) Función para dibujar la tabla (con ordenamiento)
  function renderTable() {
    // 1. Ordenar la lista según el estado actual (sortKey y sortDir)
    const sortedList = [...state.list].sort((a, b) => {
      const valA = (a[state.sortKey] || '').toString().toLowerCase();
      const valB = (b[state.sortKey] || '').toString().toLowerCase();

      if (valA < valB) return state.sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return state.sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    // 2. Limpiar tabla
    tbody.innerHTML = '';

    // 3. Si está vacía
    if (sortedList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:20px; color:#888;">
            No hay clientes registrados todavía.
          </td>
        </tr>`;
      return;
    }

    // 4. Generar filas
    sortedList.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(c.name)}</strong></td>
        <td>${escapeHtml(c.taxNumber)}</td>
        <td>${escapeHtml(c.email)}</td>
        <td>${escapeHtml(c.city)}</td>
        <td>${escapeHtml(c.country_code)}</td>
        <td>
          ${c.isActive 
            ? '<span style="color:green; font-weight:bold;">Sí</span>' 
            : '<span style="color:#ccc;">No</span>'}
        </td>
        <td style="text-align:center;">
          <button class="btn tiny" data-action="edit" data-id="${c.ID}" title="Editar">✏️</button>
          <button class="btn tiny danger" data-action="delete" data-id="${c.ID}" title="Eliminar">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // 5. Actualizar flechitas de cabecera
    updateHeaderIcons();
  }

  // C) Actualizar iconos de ordenamiento en las cabeceras
  function updateHeaderIcons() {
    host.querySelectorAll('th[data-sort]').forEach(th => {
      const key = th.dataset.sort;
      const iconSpan = th.querySelector('.sort-icon');
      
      if (key === state.sortKey) {
        iconSpan.textContent = state.sortDir === 'asc' ? ' ▲' : ' ▼';
        th.style.backgroundColor = '#cce4ff'; // Color activo
      } else {
        iconSpan.textContent = '';
        th.style.backgroundColor = ''; // Color normal
      }
    });
  }

  // D) Mostrar / Ocultar Formulario
  function toggleForm(show, mode = 'new', data = null) {
    if (!show) {
      formPanel.classList.add('hidden');
      form.reset();
      return;
    }

    formPanel.classList.remove('hidden');
    // Validar estado del botón guardar al abrir
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
      
      // Llenar campos
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

  // E) Validar formulario (Nombre obligatorio)
  function checkValidity() {
    const nameVal = form.elements.name.value.trim();
    if (nameVal.length > 0) {
      btnSave.removeAttribute('disabled');
    } else {
      btnSave.setAttribute('disabled', 'true');
    }
  }

  // ============================================================
  // EVENT LISTENERS (Interacción del usuario)
  // ============================================================

  // 1. Click en cabeceras para ordenar
  host.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      // Si ya estaba ordenado por esta columna, invertimos
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortKey = key;
        state.sortDir = 'asc'; // Default
      }
      renderTable();
    });
  });

  // 2. Botón "Nuevo Cliente"
  host.querySelector('#btn-new').addEventListener('click', () => {
    toggleForm(true, 'new');
  });

  // 3. Botón "Actualizar"
  host.querySelector('#btn-refresh').addEventListener('click', () => {
    loadData();
  });

  // 4. Botón "Cancelar" (del formulario)
  host.querySelector('#btn-cancel').addEventListener('click', () => {
    toggleForm(false);
  });

  // 5. Validación al escribir en el formulario
  form.addEventListener('input', checkValidity);

  // 6. Botones de la tabla (Editar / Eliminar)
  tbody.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'edit') {
      // Buscar el dato en memoria para no hacer otro fetch
      const item = state.list.find(x => x.ID === id);
      if (item) toggleForm(true, 'edit', item);
    } 
    else if (action === 'delete') {
      if (confirm('¿Estás seguro de eliminar este cliente?')) {
        try {
          await apiDelete(id);
          showToast('Cliente eliminado correctamente');
          loadData(); // Recargar tabla
          // Si teníamos el formulario abierto con este ID, lo cerramos
          if (form.elements.id.value === id) toggleForm(false);
        } catch (err) {
          alert('Error al eliminar: ' + err.message);
        }
      }
    }
  });

  // 7. Guardar Formulario (Crear o Editar)
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault(); // Evitar recarga de página

    // Capturar datos
    const payload = {
      name: form.elements.name.value.trim(),
      taxNumber: form.elements.taxNumber.value.trim() || null,
      email: form.elements.email.value.trim() || null,
      phone: form.elements.phone.value.trim() || null,
      street: form.elements.street.value.trim() || null,
      city: form.elements.city.value.trim() || null,
      postalCode: form.elements.postalCode.value.trim() || null,
      country_code: form.elements.country_code.value.trim() || null,
      isActive: form.elements.isActive.checked
    };

    try {
      const id = form.elements.id.value;
      
      if (id) {
        // Modo Edición
        await apiUpdate(id, payload);
        showToast('Cliente actualizado con éxito');
      } else {
        // Modo Creación
        await apiCreate(payload);
        showToast('Cliente creado con éxito');
      }

      toggleForm(false); // Cerrar formulario
      loadData();        // Recargar tabla
    } catch (err) {
      console.error(err);
      alert('Error al guardar: ' + err.message);
    }
  });

  // ============================================================
  // INICIO
  // ============================================================
  // Llamamos a loadData al final de render para arrancar todo
  loadData();
}

// ============================================================
// HELPERS GLOBALES (Fuera de render para limpieza)
// ============================================================

function escapeHtml(text) {
  if (!text) return '';
  return text.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(msg) {
  const div = document.createElement('div');
  div.className = 'toast-success'; // Estilo definido en customers.css
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// --- API Fetchers ---

async function apiCreate(data) {
  const res = await fetch(API_ROOT, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
}

async function apiUpdate(id, data) {
  const res = await fetch(`${API_ROOT}/${id}`, {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
}

async function apiDelete(id) {
  const res = await fetch(`${API_ROOT}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await res.text());
}