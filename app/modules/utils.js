// app/modules/utils.js - Herramientas globales

export async function apiFetch(url, options = {}) {
  // 1. Recuperar el token
  const token = sessionStorage.getItem('erp_token');

  // 2. Preparar encabezados
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 3. Ejecutar petición
  const response = await fetch(url, { ...options, headers });

  // 4. Si el token expiró (401/403), sacar al usuario
  if (response.status === 401 || response.status === 403) {
    sessionStorage.clear();
    window.location.href = '/login.html';
    throw new Error('Sesión expirada');
  }

  return response;
}