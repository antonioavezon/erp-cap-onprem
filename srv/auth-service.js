// srv/auth-service.js
const cds = require('@sap/cds')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const JWT_SECRET = 'secreto_super_seguro_2025'
const debug = true; // <--- MODO DEBUG ACTIVADO

module.exports = cds.service.impl(async function () {
  
  const { AppUsers } = cds.entities('erp')

  this.on('login', async (req) => {
    const { username, password } = req.data

    if (debug) console.log(`[AUTH-LOGIN-DEBUG] Intentando login para usuario: ${username}`);

    // 1. Buscar usuario
    const user = await cds.run(
      SELECT.one.from(AppUsers)
      .where({ username })
      .columns(u => { u.ID, u.username, u.password, u.systemRole, u.isActive, u.employee_ID })
    )

    if (!user) {
        if (debug) console.log(`[AUTH-LOGIN-DEBUG] FAIL: Usuario '${username}' no encontrado en DB.`);
        return req.error(401, 'Usuario o contraseña incorrectos');
    }
    
    if (!user.isActive) {
        if (debug) console.log(`[AUTH-LOGIN-DEBUG] FAIL: Usuario '${username}' está bloqueado.`);
        return req.error(403, 'Usuario bloqueado');
    }

    // 2. Validar Password
    let match = false
    
    // Si la contraseña empieza con $2b$, es un hash real.
    if (user.password && user.password.startsWith('$2b$')) {
      if (debug) console.log(`[AUTH-LOGIN-DEBUG] INFO: Usando comparación BCRYPT.`);
      match = await bcrypt.compare(password, user.password)
    } else {
      // Si no, es texto plano (solo para el seed de dev)
      if (debug) console.log(`[AUTH-LOGIN-DEBUG] INFO: Usando comparación TEXTO PLANO.`);
      match = (password === user.password) 
    }

    if (!match) {
        if (debug) console.log(`[AUTH-LOGIN-DEBUG] FAIL: Contraseña no coincide.`);
        return req.error(401, 'Usuario o contraseña incorrectos');
    }

    // 3. GENERAR TOKEN
    const tokenData = { 
      uid: user.ID, 
      username: user.username, 
      role: user.systemRole,
      empId: user.employee_ID 
    }

    const token = jwt.sign(tokenData, JWT_SECRET, { expiresIn: '8h' })

    if (debug) console.log(`[AUTH-LOGIN-DEBUG] SUCCESS: Token generado para Rol: ${user.systemRole}`);
    
    // Retornar JSON stringificado
    return JSON.stringify({ 
      token: token,
      username: user.username, 
      role: user.systemRole,
      employeeId: user.employee_ID 
    })
  })
})