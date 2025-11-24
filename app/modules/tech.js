// app/modules/tech.js
// Módulo Técnico - Dashboard de OData

import { apiFetch } from './utils.js'; // <--- IMPORTANTE

export const title = 'Vista técnica CAP';

const CSS_PATH = './modules/tech.css';

function loadStyles() {
  if (!document.querySelector(`link[href="${CSS_PATH}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_PATH;
    document.head.appendChild(link);
  }
}

export function render(host) {
  // 1. PROTECCIÓN DE ROL (Solo Admin)
  const userRole = sessionStorage.getItem('erp_role');
  if (userRole !== 'ADMIN') {
    host.innerHTML = `
      <div style="text-align:center; padding:50px; color:#c62828;">
        <h2>⛔ Acceso Restringido</h2>
        <p>Esta sección técnica es exclusiva para administradores del sistema.</p>
      </div>
    `;
    return;
  }

  loadStyles();

  host.innerHTML = `
    <div class="tech-module">
      
      <header class="tech-header">
        <h2>Recursos del Backend (OData V4)</h2>
        <p>
          Acceso directo a los servicios expuestos por SAP CAP. 
          Útil para depuración, inspección de metadatos y consumo externo.
        </p>
      </header>

      <div class="tech-grid">
        
        <article class="tech-card">
          <div class="card-icon">📜</div>
          <h3>Contrato de API ($metadata)</h3>
          <p>Esquema XML completo de la base de datos y relaciones.</p>
          <div class="tech-links">
            <button class="btn-link" data-type="xml" data-url="/catalog/$metadata">Ver XML</button>
          </div>
        </article>

        <article class="tech-card">
          <div class="card-icon">👥</div>
          <h3>Entidad: Clientes</h3>
          <p>Datos crudos en formato JSON.</p>
          <div class="tech-links">
            <button class="btn-link" data-type="json" data-url="/catalog/Customers">Ver JSON</button>
          </div>
        </article>

        <article class="tech-card">
          <div class="card-icon">📦</div>
          <h3>Entidad: Productos</h3>
          <p>Listado completo del catálogo de productos.</p>
          <div class="tech-links">
            <button class="btn-link" data-type="json" data-url="/catalog/Products">Ver JSON</button>
          </div>
        </article>

        <article class="tech-card">
          <div class="card-icon">🛒</div>
          <h3>Entidad: Pedidos</h3>
          <p>Cabeceras de pedidos de venta.</p>
          <div class="tech-links">
            <button class="btn-link" data-type="json" data-url="/catalog/SalesOrders">Ver JSON</button>
          </div>
        </article>

        <article class="tech-card">
          <div class="card-icon">🔐</div>
          <h3>Entidad: Usuarios</h3>
          <p>Tabla de usuarios del sistema (AppUsers).</p>
          <div class="tech-links">
            <button class="btn-link" data-type="json" data-url="/auth/login" disabled style="opacity:0.5; cursor:not-allowed">Protegido</button>
          </div>
        </article>

      </div>

      <div class="code-block">
        <div class="comment"># Información del Servidor</div>
        <div>Host: <span class="cmd">localhost:4004</span></div>
        <div>Protocolo: <span class="cmd">OData V4 (Secured via JWT)</span></div>
        <div>Base de datos: <span class="cmd">PostgreSQL 16</span></div>
        <div>Runtime: <span class="cmd">Node.js + @sap/cds</span></div>
      </div>

    </div>
  `;

  // --- LÓGICA PARA ABRIR ENLACES SEGUROS ---
  // Como los links normales no envían el Token, usamos fetch para bajar el dato
  // y creamos una "página virtual" para mostrarlo.
  
  const buttons = host.querySelectorAll('button[data-url]');
  
  buttons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const url = btn.dataset.url;
      const type = btn.dataset.type; // 'json' o 'xml'

      try {
        btn.textContent = 'Cargando...';
        
        // Usamos apiFetch para ir con el Token
        const res = await apiFetch(url);
        const text = await res.text(); // Obtenemos el texto plano (JSON o XML)

        // Crear un Blob (Archivo en memoria)
        const mimeType = type === 'json' ? 'application/json' : 'application/xml';
        const blob = new Blob([text], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);

        // Abrir en nueva pestaña
        window.open(blobUrl, '_blank');

      } catch (err) {
        console.error(err);
        alert('Error de acceso: ' + err.message);
      } finally {
        btn.textContent = type === 'json' ? 'Ver JSON' : 'Ver XML';
      }
    });
  });
}