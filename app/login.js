// app/login.js
const form = document.getElementById('login-form');
const errorBox = document.getElementById('error-box');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.style.display = 'none';
  
  const username = form.username.value.trim();
  const password = form.password.value.trim();

  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("[LOGIN FAIL - CONSOLA DEV]", res.status, errData);
      throw new Error(errData.error?.message || 'Credenciales inválidas');
    }

    const rawResponse = await res.json();
    const loginData = JSON.parse(rawResponse.value);

    // ✅ CORRECTO: Guardar en sessionStorage con las claves adecuadas
    sessionStorage.setItem('erp_token', loginData.token);
    sessionStorage.setItem('erp_user', loginData.username);
    sessionStorage.setItem('erp_role', loginData.role);

    // Redirigir al sistema
    window.location.href = '/index.html';

  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.style.display = 'block';
    console.error("[LOGIN FAIL - ERROR GENERAL]", err);
  }
});