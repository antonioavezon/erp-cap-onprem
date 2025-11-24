// server.js
const cds = require('@sap/cds')
const authMiddleware = require('./srv/middlewares/auth')

// Evento de arranque ("bootstrap")
cds.on('bootstrap', (app) => {
  
  console.log('🔒 Activando Sistema de Seguridad JWT...')
  
  // Aquí conectamos nuestro guardaespaldas
  app.use(authMiddleware)
  
})

module.exports = cds.server