// app/modules/company.js
// Módulo Configuración – Datos de la Empresa (Singleton)

import { apiFetch } from './utils.js'; // <--- IMPORTANTE: Importamos el fetch seguro

export const title = 'Configuración de Empresa';

// Apuntamos directamente al ID '1' porque es un Singleton lógico
const API_URL = '/catalog/CompanySettings(\'1\')';
const API_CURRENCIES = '/catalog/Currencies';
const CSS_PATH = './modules/company.css';

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

  // --- HTML Template ---
  host.innerHTML = `
    <div class="comp-module">
      
      <div class="comp-body">
        
        <div class="comp-card">
          
          <div class="card-header">
            <div class="logo-preview" id="logo-container">
              <span class="logo-placeholder">Sin Logo</span>
            </div>
            <div class="company-titles">
              <h2 id="display-name">Cargando...</h2>
              <h4 id="display-rut">...</h4>
            </div>
          </div>

          <form id="comp-form" class="comp-form" autocomplete="off">
            <div class="form-grid">
              
              <div class="form-group">
                <label>Nombre de Fantasía *</label>
                <input name="name" required maxlength="120" placeholder="Ej: Mi Tienda" />
              </div>

              <div class="form-group">
                <label>Razón Social *</label>
                <input name="businessName" required maxlength="120" placeholder="Ej: Servicios SpA" />
              </div>

              <div class="form-group">
                <label>RUT / Tax ID *</label>
                <input name="taxNumber" required maxlength="30" />
              </div>

              <div class="form-group">
                <label>Email de Contacto</label>
                <input name="contactEmail" type="email" maxlength="120" />
              </div>

              <div class="form-group full-width">
                <label>Dirección Comercial</label>
                <input name="address" maxlength="200" />
              </div>

              <div class="form-group">
                <label>Moneda Base</label>
                <select name="currency_code" required>
                  <option value="">Cargando...</option>
                </select>
              </div>

              <div class="form-group">
                <label>URL del Logo (Imagen)</label>
                <input name="logoUrl" placeholder="https://..." />
              </div>

            </div>

            <div class="form-actions">
              <button type="button" class="btn secondary" id="btn-reset">Restaurar</button>
              <button type="submit" class="btn primary">Guardar Cambios</button>
            </div>
          </form>

        </div>

      </div>
    </div>
  `;

  // Refs
  const form = host.querySelector('#comp-form');
  const logoContainer = host.querySelector('#logo-container');
  const dispName = host.querySelector('#display-name');
  const dispRut = host.querySelector('#display-rut');
  const selCurrency = form.elements.currency_code;
  const inpLogo = form.elements.logoUrl;

  // --- Lógica ---

  async function loadData() {
    try {
      // Cargar monedas y datos de empresa USANDO APIFETCH SEGURO
      const [resComp, resCurr] = await Promise.all([
        apiFetch(API_URL),
        apiFetch(`${API_CURRENCIES}?$orderby=code asc`)
      ]);

      // Llenar monedas
      if (resCurr.ok) {
        const dCurr = await resCurr.json();
        selCurrency.innerHTML = '<option value="">-- Seleccione --</option>';
        (dCurr.value || []).forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.code;
          opt.textContent = `${c.code} - ${c.name || ''}`;
          selCurrency.appendChild(opt);
        });
      }

      // Llenar Formulario
      if (resComp.ok) {
        const data = await resComp.json();
        populateForm(data);
      } else if (resComp.status === 404) {
        // Si no existe (falló el seed), dejamos el form vacío para crear
        console.warn('Empresa no configurada aún (ID 1 no encontrado).');
        dispName.textContent = "Configuración Inicial";
        dispRut.textContent = "Complete los datos";
      }

    } catch (err) {
      console.error(err);
      alert('Error al cargar datos de empresa.');
    }
  }

  function populateForm(data) {
    form.elements.name.value = data.name || '';
    form.elements.businessName.value = data.businessName || '';
    form.elements.taxNumber.value = data.taxNumber || '';
    form.elements.contactEmail.value = data.contactEmail || '';
    form.elements.address.value = data.address || '';
    form.elements.currency_code.value = data.currency_code || '';
    form.elements.logoUrl.value = data.logoUrl || '';

    updatePreview(data.name, data.taxNumber, data.logoUrl);
  }

  function updatePreview(name, rut, url) {
    dispName.textContent = name || 'Sin Nombre';
    dispRut.textContent = rut || '---';

    if (url) {
      logoContainer.innerHTML = `<img src="${url}" alt="Logo" onerror="this.style.display='none'"/>`;
    } else {
      logoContainer.innerHTML = `<span class="logo-placeholder">Sin Logo</span>`;
    }
  }

  // Eventos
  inpLogo.addEventListener('input', () => {
    updatePreview(form.elements.name.value, form.elements.taxNumber.value, inpLogo.value);
  });
  
  form.elements.name.addEventListener('input', () => {
    dispName.textContent = form.elements.name.value || 'Sin Nombre';
  });

  host.querySelector('#btn-reset').addEventListener('click', loadData);

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const formData = new FormData(form);
    
    const payload = {
      name: formData.get('name').trim(),
      businessName: formData.get('businessName').trim(),
      taxNumber: formData.get('taxNumber').trim(),
      contactEmail: formData.get('contactEmail').trim(),
      address: formData.get('address').trim(),
      currency_code: formData.get('currency_code'),
      logoUrl: formData.get('logoUrl').trim()
    };

    try {
      // Intentamos hacer PUT (Actualizar) USANDO APIFETCH
      let res = await apiFetch(API_URL, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });

      // Si falla con 404, hacemos POST (Crear ID 1) USANDO APIFETCH
      if (res.status === 404) {
        res = await apiFetch('/catalog/CompanySettings', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ ...payload, ID: '1' })
        });
      }

      if (!res.ok) throw new Error(await res.text());

      showToast('Datos de empresa guardados exitosamente');
      
    } catch (err) {
      console.error(err);
      alert('Error al guardar: ' + err.message);
    }
  });

  loadData();
}

function showToast(msg) {
  const div = document.createElement('div');
  div.className = 'toast-success';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}