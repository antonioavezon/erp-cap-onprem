import { getWithToken } from './utils.js';

/**
 * Módulo de Análisis de Datos (Analytics)
 * 
 * Implementación PROFESIONAL usando Chart.js (CDN).
 * Garantiza respuesta móvil perfecta, tooltips y renderizado robusto.
 */

// Función auxiliar para cargar script externo
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

export async function render(container) {
    // 1. Inyectar CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'modules/analytics.css';
    document.head.appendChild(link);

    // 2. Estructura HTML (Limpiamos el contenedor primero)
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
                <!-- Usamos Canvas para Chart.js con altura fija controlada por CSS -->
                <div class="chart-wrapper">
                    <canvas id="chart-sales"></canvas>
                </div>
                <div class="stats-row">
                    <div class="stat-item">
                        <span class="label">Total Histórico</span>
                        <strong class="value history-text" id="sales-total-hist">...</strong>
                    </div>
                    <div class="stat-item">
                        <span class="label">Proyección</span>
                        <strong class="value projection-text" id="sales-total-proj">...</strong>
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
                 <div class="chart-wrapper">
                    <canvas id="chart-purchases"></canvas>
                </div>
                <div class="stats-row">
                    <div class="stat-item">
                        <span class="label">Gasto Real</span>
                        <strong class="value history-text" id="purch-total-hist">...</strong>
                    </div>
                    <div class="stat-item">
                        <span class="label">Proyección</span>
                        <strong class="value projection-text" id="purch-total-proj">...</strong>
                    </div>
                </div>
            </div>
        </section>
    </div>
  `;

    // 3. Cargar Chart.js y Datos
    try {
        await loadScript('https://cdn.jsdelivr.net/npm/chart.js');

        // Configuración Común
        const isMobile = window.innerWidth < 768;
        Chart.defaults.font.family = "system-ui, -apple-system, sans-serif";
        Chart.defaults.color = "#666";

        // Datos Demo
        const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];

        // Ventas
        const salesDataHist = [8500000, 9200000, 12500000, 11000000, null, null];
        const salesDataProj = [null, null, null, 11000000, 13500000, 14200000]; // Overlay start for continuity

        // Compras
        const purchDataHist = [4500000, 5100000, 4800000, 6500000, null, null];
        const purchDataProj = [null, null, null, 6500000, 6200000, 5900000];

        // Función para crear gráficos
        const createChart = (ctxId, dataH, dataP, label) => {
            const ctx = document.getElementById(ctxId).getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Histórico',
                            data: dataH,
                            borderColor: '#2e7d32', // Verde
                            backgroundColor: '#2e7d32',
                            tension: 0.3,
                            fill: false,
                            pointRadius: 4
                        },
                        {
                            label: 'Proyección',
                            data: dataP,
                            borderColor: '#1565c0', // Azul
                            backgroundColor: '#1565c0',
                            borderDash: [5, 5],
                            tension: 0.3,
                            fill: false,
                            pointRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Importante para CSS height
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function (context) {
                                    return ' $' + context.parsed.y.toLocaleString('es-CL');
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return '$' + (value / 1000000).toFixed(1) + 'M';
                                },
                                font: { size: 10 }
                            }
                        },
                        x: {
                            ticks: {
                                font: { size: isMobile ? 10 : 12 }
                            }
                        }
                    }
                }
            });
        };

        // Renderizar
        createChart('chart-sales', salesDataHist, salesDataProj, 'Ventas');
        createChart('chart-purchases', purchDataHist, purchDataProj, 'Compras');

        // Totales Simples (Hardcoded sum for demo speed)
        const fmt = (v) => v.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
        document.getElementById('sales-total-hist').textContent = fmt(41200000);
        document.getElementById('sales-total-proj').textContent = fmt(27700000);
        document.getElementById('purch-total-hist').textContent = fmt(20900000);
        document.getElementById('purch-total-proj').textContent = fmt(12100000);

    } catch (err) {
        console.error("Error cargando Analytics:", err);
        container.innerHTML += `<div class="error-msg" style="color:red; text-align:center;">Error cargando gráficos. Revise conexión.</div>`;
    }
}
