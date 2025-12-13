// server.js
const cds = require('@sap/cds')
const authMiddleware = require('./srv/middlewares/auth')

// Evento de arranque ("bootstrap")
cds.on('bootstrap', (app) => {

  console.log('🔒 Activando Sistema de Seguridad JWT...')

  // Aumentar el límite de tamaño para subidas (imágenes en Base64)
  const express = require('express')
  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ limit: '50mb', extended: true }))

  // Aquí conectamos nuestro guardaespaldas
  app.use(authMiddleware)

})

module.exports = cds.server