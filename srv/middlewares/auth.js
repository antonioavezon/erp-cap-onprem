// srv/middlewares/auth.js
const jwt = require('jsonwebtoken')
const JWT_SECRET = 'secreto_super_seguro_2025' 
const debug = true; // Mantener debug

module.exports = (req, res, next) => {
  
  // 1. LISTA BLANCA (Rutas Públicas)
  const publicPaths = [
    '/', // <--- AGREGADO: La ruta raíz (/) debe ser pública para servir index.html
    '/auth/login',
    '/favicon.ico', 
    '/login.html',
    '/login.js',
    '/login.css',
    '/styles.css'
  ]
  
  // Si la URL comienza con algo de la lista, pasa sin control
  if (publicPaths.some(path => req.url.startsWith(path))) {
    if (debug) console.log(`[AUTH-DEBUG] 🔓 PASS: Ruta pública permitida: ${req.url}`);
    return next()
  }

  // 2. VERIFICACIÓN DEL TOKEN (El resto del código sigue igual)
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    if (debug) console.log(`[AUTH-DEBUG] ❌ FAIL-1: Falta Token de autorización para: ${req.url}`);
    
    // Si no hay token, redirigir al login (solo si es navegador)
    const accept = req.headers.accept || ''
    if (accept.includes('text/html')) {
      if (debug) console.log('[AUTH-DEBUG] ACTION: Redirigiendo navegador (302) a /login.html');
      res.writeHead(302, { Location: '/login.html' })
      return res.end()
    }
    
    if (debug) console.log('[AUTH-DEBUG] ACTION: Denegando API (401 JSON)');
    res.statusCode = 401
    return res.end(JSON.stringify({ error: 'Acceso denegado: Falta Token' }))
  }

  const token = authHeader.split(' ')[1]

  // 3. VALIDAR Y DECODIFICAR
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    
    if (debug) console.log(`[AUTH-DEBUG] ✅ SUCCESS: Autorizado usuario ${decoded.username} (${decoded.role}) para ${req.url}`);
    
    req.user = decoded 
    next()

  } catch (err) {
    if (debug) console.log(`[AUTH-DEBUG] 🛑 FAIL-2: Token inválido o expirado. Motivo: ${err.message}`);

    const accept = req.headers.accept || ''
    if (accept.includes('text/html')) {
      if (debug) console.log('[AUTH-DEBUG] ACTION: Token inválido. Redirigiendo browser a /login.html');
      res.writeHead(302, { Location: '/login.html' })
      return res.end()
    }
    
    if (debug) console.log('[AUTH-DEBUG] ACTION: Devolviendo 403 JSON.');
    res.statusCode = 403
    return res.end(JSON.stringify({ error: 'Token inválido o expirado' }))
  }
}