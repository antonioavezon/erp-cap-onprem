import { apiFetch } from './utils.js';

export const title = 'Configuración de Empresa';

const API_URL = '/catalog/CompanySettings(\'1\')';
const API_CURRENCIES = '/catalog/Currencies';
const CSS_PATH = './modules/company.css';

// Variable local para guardar el Base64 actual
let currentLogoBase64 = ''; 

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

  host.innerHTML = `
    <div class="comp-module">
      <div class="comp-body">
        <div class="comp-card">
          
          <div class="card-header">
            <div class="logo-wrapper">
                <div class="logo-preview" id="logo-container" title="Click para cambiar logo">
                    <span class="logo-placeholder">Sin Logo</span>
                </div>
                <input type="file" id="file-upload" accept="image/*" style="display: none;" />
                <button type="button" class="btn-text" id="btn-trigger-upload">Cambiar Logo</button>
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
                <input name="name" required maxlength="120" />
              </div>

              <div class="form-group">
                <label>Razón Social *</label>
                <input name="businessName" required maxlength="120" />
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
  const fileInput = host.querySelector('#file-upload');
  const btnTrigger = host.querySelector('#btn-trigger-upload');
  const dispName = host.querySelector('#display-name');
  const dispRut = host.querySelector('#display-rut');
  const selCurrency = form.elements.currency_code;

  // --- Lógica de Imagen (File Reader) ---

  // Al hacer clic en el cuadro o el botón, abrir selector de archivos
  const openFileSelector = () => fileInput.click();
  logoContainer.addEventListener('click', openFileSelector);
  btnTrigger.addEventListener('click', openFileSelector);

  // Cuando se selecciona un archivo
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamaño (ej: Max 1MB)
    if (file.size > 1024 * 1024) {
        alert("La imagen es muy pesada. Máximo 1MB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        // Actualizamos la variable local y la vista
        currentLogoBase64 = event.target.result; 
        updateLogoView(currentLogoBase64);
    };
    reader.readAsDataURL(file); // Convertir a Base64
  });

  // --- Funciones de Carga y Guardado ---

  async function loadData() {
    try {
      const [resComp, resCurr] = await Promise.all([
        apiFetch(API_URL),
        apiFetch(`${API_CURRENCIES}?$orderby=code asc`)
      ]);

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

      if (resComp.ok) {
        const data = await resComp.json();
        populateForm(data);
      } else {
        dispName.textContent = "Nueva Empresa";
        dispRut.textContent = "Complete datos";
      }

    } catch (err) {
      console.error(err);
    }
  }

  function populateForm(data) {
    form.elements.name.value = data.name || '';
    form.elements.businessName.value = data.businessName || '';
    form.elements.taxNumber.value = data.taxNumber || '';
    form.elements.contactEmail.value = data.contactEmail || '';
    form.elements.address.value = data.address || '';
    form.elements.currency_code.value = data.currency_code || '';
    
    // Guardamos el logo que viene de la BD en la variable local
    currentLogoBase64 = data.logoUrl || ''; 
    
    updateHeader(data.name, data.taxNumber);
    updateLogoView(currentLogoBase64);
  }

  function updateLogoView(base64Str) {
    if (base64Str) {
      logoContainer.innerHTML = `<img src="${base64Str}" alt="Logo" style="width:100%; height:100%; object-fit:contain;" />`;
      logoContainer.classList.add('has-logo');
    } else {
      logoContainer.innerHTML = `<span class="logo-placeholder">Sin Logo</span>`;
      logoContainer.classList.remove('has-logo');
    }
  }

  function updateHeader(name, rut) {
    dispName.textContent = name || 'Sin Nombre';
    dispRut.textContent = rut || '---';
  }

  // Evento live typing para actualizar título
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
      logoUrl: currentLogoBase64 // Enviamos el Base64 aquí
    };

    try {
      let res = await apiFetch(API_URL, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });

      if (res.status === 404) {
        res = await apiFetch('/catalog/CompanySettings', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ ...payload, ID: '1' })
        });
      }

      if (!res.ok) throw new Error(await res.text());
      alert('Datos guardados exitosamente');
      
    } catch (err) {
      console.error(err);
      alert('Error: ' + err.message);
    }
  });

  loadData();
}