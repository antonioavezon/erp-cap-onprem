// app/modules/catalog.js (o tech.js según tu index)
// Módulo Técnico - Dashboard de OData

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
          <p>
            Documento XML que describe la estructura completa de la base de datos, 
            relaciones entre entidades y tipos de datos. Es el "mapa" del ERP.
          </p>
          <div class="tech-links">
            <a href="/catalog/$metadata" target="_blank" class="btn-link">Ver XML Metadatos</a>
          </div>
        </article>

        <article class="tech-card">
          <div class="card-icon">👥</div>
          <h3>Entidad: Clientes</h3>
          <p>
            Datos crudos en formato JSON servidos por el backend. 
            Útil para verificar si los datos se están guardando correctamente en PostgreSQL.
          </p>
          <div class="tech-links">
            <a href="/catalog/Customers" target="_blank" class="btn-link">Ver JSON</a>
          </div>
        </article>

        <article class="tech-card">
          <div class="card-icon">📦</div>
          <h3>Entidad: Productos</h3>
          <p>
            Listado completo del catálogo de productos incluyendo precios y monedas 
            directamente desde la API OData.
          </p>
          <div class="tech-links">
            <a href="/catalog/Products" target="_blank" class="btn-link">Ver JSON</a>
          </div>
        </article>

        <article class="tech-card">
          <div class="card-icon">🛒</div>
          <h3>Entidad: Pedidos</h3>
          <p>
            Cabeceras de pedidos de venta. Incluye enlaces de navegación a Clientes 
            y detalles de ítems.
          </p>
          <div class="tech-links">
            <a href="/catalog/SalesOrders" target="_blank" class="btn-link">Ver JSON</a>
          </div>
        </article>

        <article class="tech-card">
          <div class="card-icon">💠</div>
          <h3>Fiori Preview</h3>
          <p>
            Interfaz estándar generada automáticamente por SAP CAP basada en anotaciones.
            Requiere configuración de Fiori Elements.
          </p>
          <div class="tech-links">
            <a href="/" target="_blank" class="btn-link">Ir a Inicio CAP</a>
          </div>
        </article>

      </div>

      <div class="code-block">
        <div class="comment"># Información del Servidor</div>
        <div>Host: <span class="cmd">localhost:4004</span></div>
        <div>Protocolo: <span class="cmd">OData V4</span></div>
        <div>Base de datos: <span class="cmd">PostgreSQL 16 (Alpine)</span></div>
        <div>Runtime: <span class="cmd">Node.js + @sap/cds</span></div>
      </div>

    </div>
  `;
}