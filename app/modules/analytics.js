import { getWithToken } from './utils.js';

/**
 * Módulo de Análisis de Datos (Analytics)
 * 
 * Muestra dashboards de Ventas y Compras con proyecciones.
 * Implementa una librería de gráficos ultra-liera basada en SVG sin dependencias externas.
 */

/* =========================================================
   LÓGICA DE GRÁFICOS (SVG)
   ========================================================= */
class SimpleChart {
    constructor(container, options) {
        this.container = container;
        this.data = options.data || []; // Array of { label, value, type: 'history'|'projection' }
        this.colorHistory = options.colorHistory || '#4caf50'; // Green
        this.colorProjection = options.colorProjection || '#2196f3'; // Blue
        this.height = options.height || 300;
        this.padding = 40;
    }

    render() {
        this.container.innerHTML = '';
        if (!this.data.length) return;

        const width = this.container.offsetWidth || 600;
        const height = this.height;
        const maxVal = Math.max(...this.data.map(d => d.value)) * 1.1;
        const minVal = 0;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.style.overflow = 'visible';

        // Ejes
        const stepX = (width - this.padding * 2) / (this.data.length - 1);
        const scaleY = (val) => height - this.padding - ((val / maxVal) * (height - this.padding * 2));

        // Dibujar líneas
        let pathHistory = '';
        let pathProjection = '';

        // Encontrar punto de quiebre (donde termina historia y empieza proyección)
        // Asumimos que la proyección continúa desde el último punto histórico
        let lastHistoryIndex = -1;
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i].type === 'history') lastHistoryIndex = i;
        }

        // Generar Path Historia
        this.data.forEach((point, i) => {
            const x = this.padding + (i * stepX);
            const y = scaleY(point.value);

            if (i === 0) pathHistory += `M ${x} ${y}`;
            else if (i <= lastHistoryIndex) pathHistory += ` L ${x} ${y}`;

            // Dibujar Puntos
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', 4);
            circle.setAttribute('fill', point.type === 'history' ? this.colorHistory : this.colorProjection);

            // Tooltip simple
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `${point.label}: ${point.value.toLocaleString()}`;
            circle.appendChild(title);
            svg.appendChild(circle);

            // Etiquetas Eje X
            if (i % 2 === 0 || i === this.data.length - 1) { // Mostrar cada 2 para no saturar
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', x);
                text.setAttribute('y', height - 10);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '10');
                text.setAttribute('fill', '#666');
                text.textContent = point.label;
                svg.appendChild(text);
            }
        });

        // Generar Path Proyección
        // Debe empezar desde el último punto de historia para continuidad visual
        if (lastHistoryIndex !== -1 && lastHistoryIndex < this.data.length - 1) {
            const xABC = this.padding + (lastHistoryIndex * stepX);
            const yABC = scaleY(this.data[lastHistoryIndex].value);
            pathProjection += `M ${xABC} ${yABC}`;

            for (let i = lastHistoryIndex + 1; i < this.data.length; i++) {
                const x = this.padding + (i * stepX);
                const y = scaleY(point => scaleY(this.data[i].value)); // Bug fix logic refer
                // Recalcular Y localmente porque closure
                const yLocal = scaleY(this.data[i].value);
                pathProjection += ` L ${x} ${yLocal}`;
            }
        }

        // Agregar Paths al SVG
        const lineH = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        lineH.setAttribute('d', pathHistory);
        lineH.setAttribute('stroke', this.colorHistory);
        lineH.setAttribute('stroke-width', '3');
        lineH.setAttribute('fill', 'none');
        svg.appendChild(lineH);

        const lineP = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        lineP.setAttribute('d', pathProjection);
        lineP.setAttribute('stroke', this.colorProjection);
        lineP.setAttribute('stroke-width', '3');
        lineP.setAttribute('stroke-dasharray', '5,5'); // Punteado para proyección
        lineP.setAttribute('fill', 'none');
        svg.appendChild(lineP);

        this.container.appendChild(svg);
    }
}

/* =========================================================
   LÓGICA DEL MÓDULO
   ========================================================= */

export async function render(container) {
    // 1. Inyectar CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'modules/analytics.css';
    document.head.appendChild(link);

    // 2. Estructura HTML
    container.innerHTML = `
    <div class="analytics-container fade-in">
        <header class="module-header">
            <h2>📊 Análisis de Datos</h2>
            <p class="subtitle">Proyección de Gastos y Ganancias</p>
        </header>

        <!-- DASHBOARD VENTAS -->
        <section class="dashboard-card">
            <div class="card-header">
                <h3>Ventas Mensuales</h3>
                <span class="badge sale">Comercial</span>
            </div>
            <div class="card-body">
                <div id="chart-sales" class="chart-container"></div>
                <div class="stats-row">
                    <div class="stat-item">
                        <span class="label">Total Histórico</span>
                        <strong class="value history-text" id="sales-total-hist">Cargando...</strong>
                    </div>
                    <div class="stat-item">
                        <span class="label">Proyección Q1</span>
                        <strong class="value projection-text" id="sales-total-proj">Cargando...</strong>
                    </div>
                </div>
            </div>
        </section>

        <hr class="dashboard-divider">

        <!-- DASHBOARD COMPRAS -->
        <section class="dashboard-card">
            <div class="card-header">
                <h3>Gastos de Compras</h3>
                <span class="badge purchase">Aprovisionamiento</span>
            </div>
            <div class="card-body">
                <div id="chart-purchases" class="chart-container"></div>
                <div class="stats-row">
                    <div class="stat-item">
                        <span class="label">Gasto Real</span>
                        <strong class="value history-text" id="purch-total-hist">Cargando...</strong>
                    </div>
                    <div class="stat-item">
                        <span class="label">Proyección Q1</span>
                        <strong class="value projection-text" id="purch-total-proj">Cargando...</strong>
                    </div>
                </div>
            </div>
        </section>
    </div>
  `;

    // 3. Obtener Datos Reales (Para mezclar)
    // Intentamos obtener moneda de la empresa
    let currency = 'CLP';
    try {
        const settings = await getWithToken('/odata/v4/catalog/CompanySettings');
        if (settings && settings.value && settings.value.length > 0) {
            currency = settings.value[0].currency_code || 'CLP';
        }
    } catch (e) { console.warn('No settings found', e); }

    // 4. Generar Datos DEMO (Mezcla de Realidad + Ficción para la Demo)
    // Meses: Enero, Febrero, Marzo, Abril (Real), Mayo (Proj), Junio (Proj)

    const salesData = [
        { label: 'Ene', value: 8500000, type: 'history' },
        { label: 'Feb', value: 9200000, type: 'history' },
        { label: 'Mar', value: 12500000, type: 'history' },
        { label: 'Abr', value: 11000000, type: 'history' }, // Asumimos mes actual con datos reales
        { label: 'May', value: 13500000, type: 'projection' },
        { label: 'Jun', value: 14200000, type: 'projection' }
    ];

    const purchData = [
        { label: 'Ene', value: 4500000, type: 'history' },
        { label: 'Feb', value: 5100000, type: 'history' },
        { label: 'Mar', value: 4800000, type: 'history' },
        { label: 'Abr', value: 6500000, type: 'history' },
        { label: 'May', value: 6200000, type: 'projection' },
        { label: 'Jun', value: 5900000, type: 'projection' }
    ];

    // 5. Renderizar Gráficos
    setTimeout(() => {
        // Sales Chart
        new SimpleChart(document.getElementById('chart-sales'), {
            data: salesData,
            colorHistory: '#2e7d32', // Verde
            colorProjection: '#1565c0' // Azul
        }).render();

        // Purchases Chart
        new SimpleChart(document.getElementById('chart-purchases'), {
            data: purchData,
            colorHistory: '#2e7d32', // Verde
            colorProjection: '#1565c0' // Azul
        }).render();

        // Actualizar Totales Texto
        const fmt = (val) => val.toLocaleString('es-CL', { style: 'currency', currency: currency });

        document.getElementById('sales-total-hist').textContent = fmt(salesData.filter(d => d.type === 'history').reduce((a, b) => a + b.value, 0));
        document.getElementById('sales-total-proj').textContent = fmt(salesData.filter(d => d.type === 'projection').reduce((a, b) => a + b.value, 0));

        document.getElementById('purch-total-hist').textContent = fmt(purchData.filter(d => d.type === 'history').reduce((a, b) => a + b.value, 0));
        document.getElementById('purch-total-proj').textContent = fmt(purchData.filter(d => d.type === 'projection').reduce((a, b) => a + b.value, 0));

    }, 100);
}
