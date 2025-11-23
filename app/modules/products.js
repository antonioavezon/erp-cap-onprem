// app/modules/products.js
// Módulo Productos – Versión Profesional (CSS Grid Layout)

export const title = 'Productos';

const API_ROOT = '/catalog/Products';
const CSS_PATH = './modules/products.css';

/**
 * Carga dinámica de estilos
 */
function loadStyles() {
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
  loadStyles();

  const state = {
    list: [],
    sortKey: 'name',
    sortDir: 'asc',
    isEditing: false
  };

  // --- Template HTML Profesional ---
  host.innerHTML = `
    <div class="prod-module">
      
      <header class="prod-header">
        <div class="prod-actions">
          <button type="button" class="btn ghost" id="btn-refresh" title="Recargar lista">
            🔄 Actualizar
          </button>
          <button type="button" class="btn primary" id="btn-new">
            + Nuevo producto
          </button>
        </div>
      </header>

      <div class="prod-body">
        
        <section class="prod-list">
          <div class="table-container">
            <table class="prod-table">
              <thead>
                <tr>
                  <th data-sort="name">Nombre <span class="sort-icon"></span></th>
                  <th data-sort="sku">SKU <span class="sort-icon"></span></th>
                  <th data-sort="price">Precio <span class="sort-icon"></span></th>
                  <th data-sort="currency_code">Moneda <span class="sort-icon"></span></th>
                  <th data-sort="isActive">Activo <span class="sort-icon"></span></th>
                  <th style="width: 110px; text-align:center;">Acciones</th>
                </tr>
              </thead>
              <tbody id="prod-table-body">
                <tr>
                  <td colspan="6" style="text-align:center; padding:30px; color:#888;">
                    Cargando catálogo...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="prod-form-panel" class="prod-form-wrapper hidden">
          <header class="prod-form-header">
            <h3 id="form-title">Nuevo Producto</h3>
          </header>
          
          <form id="prod-form" class="prod-form" autocomplete="off">
            <input type="hidden" name="id" />

            <div class="form-grid">
              
              <div class="form-group full-width">
                <label>Nombre del producto *</label>
                <input name="name" required maxlength="120" placeholder="Ej: Laptop Gamer X1" />
              </div>

              <div class="form-group">
                <label>SKU (Código)</label>
                <input name="sku" maxlength="40" placeholder="Ej: LP-001" />
              </div>

              <div class="form-group">
                <label>Moneda (ISO)</label>
                <input name="currency_code" maxlength="3" placeholder="CLP" style="text-transform: uppercase;" />
              </div>

              <div class="form-group">
                <label>Precio</label>
                <input name="price" type="number" step="0.01" min="0" placeholder="0.00" />
              </div>

               <div class="form-group" style="justify-content: flex-end;">
                 <div class="form-check">
                    <input type="checkbox" id="chk-active" name="isActive" checked />
                    <label for="chk-active">Activo</label>
                 </div>
              </div>

              <div class="form-group full-width">
                <label>Descripción</label>
                <textarea name="description" rows="3" maxlength="255" placeholder="Detalles técnicos..."></textarea>
              </div>

            </div> <div class="form-actions">
              <button type="button" class="btn secondary btn-full" id="btn-cancel">Cancelar</button>
              <button type="submit" class="btn primary btn-full" id="btn-save" disabled>Crear</button>
            </div>
          </form>
        </section>

      </div>
    </div>
  `;

  const tbody = host.querySelector('#prod-table-body');
  const formPanel = host.querySelector('#prod-form-panel');
  const form = host.querySelector('#prod-form');
  const formTitle = host.querySelector('#form-title');
  const btnSave = host.querySelector('#btn-save');

  // ============================================================
  // LÓGICA DE NEGOCIO
  // ============================================================

  async function loadData() {
    try {
      const res = await fetch(`${API_ROOT}?$orderby=name asc`);
      const data = await res.json();
      state.list = data.value || [];
      renderTable();
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="6" style="color:#d00; text-align:center; padding:20px;">Error de conexión con el servidor</td></tr>`;
    }
  }

  function renderTable() {
    const sortedList = [...state.list].sort((a, b) => {
      let valA = a[state.sortKey];
      let valB = b[state.sortKey];

      if (state.sortKey === 'price') {
        valA = valA == null ? 0 : Number(valA);
        valB = valB == null ? 0 : Number(valB);
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
        <tr><td colspan="6" style="text-align:center; padding:40px; color:#888;">
          <div style="font-size:2rem; margin-bottom:10px;">📦</div>
          No hay productos en el catálogo.<br>Crea uno nuevo con el botón superior.
        </td></tr>`;
      return;
    }

    sortedList.forEach(p => {
      const priceFmt = p.price != null 
        ? Number(p.price).toLocaleString('es-CL', { minimumFractionDigits: 2 }) 
        : '-';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color:#0056b3;">${escapeHtml(p.name)}</strong></td>
        <td><span style="font-family:monospace; background:#eee; padding:2px 6px; border-radius:4px;">${escapeHtml(p.sku)}</span></td>
        <td style="text-align:right;">${priceFmt}</td>
        <td style="text-align:center;">${escapeHtml(p.currency_code)}</td>
        <td>
          ${p.isActive 
            ? '<span style="color:#2e7d32; font-size:0.85rem; font-weight:bold;">● Activo</span>' 
            : '<span style="color:#999; font-size:0.85rem;">○ Inactivo</span>'}
        </td>
        <td style="text-align:center;">
          <button class="btn tiny" data-action="edit" data-id="${p.ID}" title="Editar">✏️</button>
          <button class="btn tiny danger" data-action="delete" data-id="${p.ID}" title="Eliminar">🗑️</button>
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
        th.style.color = '#000';
      } else {
        icon.textContent = '';
        th.style.backgroundColor = '';
        th.style.color = '';
      }
    });
  }

  // --- Gestión Formulario ---
  function toggleForm(show, mode = 'new', data = null) {
    if (!show) {
      formPanel.classList.add('hidden');
      form.reset();
      return;
    }

    formPanel.classList.remove('hidden');
    checkValidity();

    if (mode === 'new') {
      formTitle.textContent = 'Nuevo Producto';
      btnSave.textContent = 'Crear Producto';
      state.isEditing = false;
      form.reset();
      form.elements.id.value = '';
      form.elements.isActive.checked = true;
    } else {
      formTitle.textContent = 'Editar Producto';
      btnSave.textContent = 'Guardar Cambios';
      state.isEditing = true;

      form.elements.id.value = data.ID;
      form.elements.name.value = data.name || '';
      form.elements.sku.value = data.sku || '';
      form.elements.price.value = data.price != null ? data.price : '';
      form.elements.currency_code.value = data.currency_code || '';
      form.elements.description.value = data.description || '';
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

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const formData = new FormData(form);
    
    const rawPrice = formData.get('price');
    const priceVal = rawPrice ? parseFloat(rawPrice) : null;

    const payload = {
      name: formData.get('name').trim(),
      sku: formData.get('sku').trim() || null,
      price: priceVal,
      currency_code: (formData.get('currency_code') || '').toUpperCase().trim() || null,
      description: formData.get('description').trim() || null,
      isActive: form.elements.isActive.checked
    };

    try {
      const id = formData.get('id');
      if (id) {
        await apiUpdate(id, payload);
        showToast('Producto actualizado correctamente');
      } else {
        await apiCreate(payload);
        showToast('Producto creado con éxito');
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
    } 
    else if (action === 'delete') {
      if (confirm('¿Confirma que desea eliminar este producto?')) {
        try {
          await apiDelete(id);
          showToast('Producto eliminado');
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
  return text.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function showToast(msg) {
  const div = document.createElement('div');
  div.className = 'toast-success';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

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