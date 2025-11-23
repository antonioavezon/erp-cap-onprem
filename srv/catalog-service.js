// srv/catalog-service.js
const cds = require('@sap/cds')

module.exports = cds.service.impl(async function () {
  
  // Obtenemos todas las entidades del modelo
  const { 
    Products, 
    SalesOrders, 
    SalesOrderItems, 
    StockMovements,
    PurchaseOrders, 
    PurchaseOrderItems 
  } = this.entities

  /**
   * ===========================================================
   * LÓGICA DE PRODUCTOS (General)
   * ===========================================================
   */
  this.before('CREATE', Products, (req) => {
    const { price, isActive, stock } = req.data
    if (price == null || price <= 0) req.error(400, 'Price must be greater than zero')
    if (isActive == null) req.data.isActive = true
    if (stock == null) req.data.stock = 0
  })

  /**
   * ===========================================================
   * MÓDULO DE VENTAS (Sales) - SALIDA DE STOCK
   * ===========================================================
   */

  // 1. Calcular importe de línea (Cantidad * Precio)
  this.before('CREATE', SalesOrderItems, (req) => {
    const { quantity, unitPrice } = req.data
    if (!quantity || quantity <= 0) return req.error(400, 'Quantity > 0')
    if (!unitPrice || unitPrice < 0) return req.error(400, 'Price >= 0')
    
    req.data.lineAmount = quantity * unitPrice
  })

  // 2. Actualizar total del Pedido de Venta al cambiar ítems
  this.after(['CREATE', 'UPDATE', 'DELETE'], SalesOrderItems, async (items, req) => {
    const affected = Array.isArray(items) ? items : [items]
    const tx = cds.transaction(req)

    for (const item of affected) {
      const orderId = item.order_ID || item.order_id || item.order
      if (!orderId) continue

      const res = await tx.read(SalesOrderItems)
        .where({ order_ID: orderId })
        .columns(s => s.sum('lineAmount').as('total'))
      
      const total = res[0]?.total || 0
      await tx.update(SalesOrders, orderId).with({ totalAmount: total })
    }
  })

  // 3. ACCIÓN SUBMIT: Validar Vendedor -> Validar Stock -> Restar -> Confirmar
  this.on('submit', SalesOrders, async (req) => {
    const { ID } = req.data
    const tx = cds.transaction(req)

    // A) Leer cabecera para validar Vendedor (NUEVO)
    const order = await tx.read(SalesOrders, ID)
    if (!order) return req.error(404, 'Order not found')
    
    // [VALIDACIÓN RRHH] ¿Quién vende?
    if (!order.salesPerson_ID) {
      return req.error(400, 'No se puede confirmar la venta sin asignar un Vendedor (SalesPerson).')
    }

    // B) Verificar ítems
    const items = await tx.read(SalesOrderItems).where({ order_ID: ID })
    if (!items.length) return req.error(400, 'Cannot submit empty order')

    // C) Procesar cada ítem
    for (const item of items) {
      const product = await tx.read(Products, item.product_ID)
      
      // Validar disponibilidad
      if (!product || product.stock < item.quantity) {
        return req.error(409, `Stock insuficiente para: ${product?.name || item.product_ID}`)
      }

      // Restar Stock
      const newStock = product.stock - item.quantity
      await tx.update(Products, item.product_ID).with({ stock: newStock })

      // [TRAZABILIDAD] Registrar Movimiento en Kardex ligado al Vendedor
      await tx.create(StockMovements).entries({
        product_ID: item.product_ID,
        type: 'OUT',
        quantity: item.quantity,
        reference: `Venta ${order.orderNo || ID}`,
        responsible_ID: order.salesPerson_ID, // <--- AQUÍ LIGAMOS AL HUMANO
        date: new Date()
      })
    }

    // D) Cambiar estado
    await tx.update(SalesOrders, ID).with({ status: 'CONFIRMED' })
    return tx.read(SalesOrders, ID)
  })

  /**
   * ===========================================================
   * MÓDULO DE COMPRAS (Procurement) - ENTRADA DE STOCK
   * ===========================================================
   */

  // 1. Calcular importe de línea (Cantidad * Costo)
  this.before('CREATE', PurchaseOrderItems, (req) => {
    const { quantity, unitCost } = req.data
    if (!quantity || quantity <= 0) return req.error(400, 'Quantity > 0')
    if (unitCost < 0) return req.error(400, 'Cost >= 0')

    req.data.lineTotal = quantity * unitCost
  })

  // 2. Actualizar total del Pedido de Compra
  this.after(['CREATE', 'UPDATE', 'DELETE'], PurchaseOrderItems, async (items, req) => {
    const affected = Array.isArray(items) ? items : [items]
    const tx = cds.transaction(req)

    for (const item of affected) {
      const orderId = item.order_ID || item.order_id || item.order
      if (!orderId) continue

      const res = await tx.read(PurchaseOrderItems)
        .where({ order_ID: orderId })
        .columns(s => s.sum('lineTotal').as('total'))

      const total = res[0]?.total || 0
      await tx.update(PurchaseOrders, orderId).with({ totalAmount: total })
    }
  })

  // 3. ACCIÓN RECEIVE: Validar Comprador -> Sumar Stock -> Confirmar
  this.on('receive', PurchaseOrders, async (req) => {
    const { ID } = req.data
    const tx = cds.transaction(req)

    // A) Leer cabecera para validar Comprador (NUEVO)
    const order = await tx.read(PurchaseOrders, ID)
    if (!order) return req.error(404, 'Order not found')

    // [VALIDACIÓN RRHH] ¿Quién recibe/compra?
    if (!order.buyer_ID) {
      return req.error(400, 'No se puede recibir mercadería sin asignar un Responsable (Buyer).')
    }

    // B) Verificar ítems
    const items = await tx.read(PurchaseOrderItems).where({ order_ID: ID })
    if (!items.length) return req.error(400, 'Cannot receive empty order')

    // C) Procesar entrada
    for (const item of items) {
      const product = await tx.read(Products, item.product_ID)
      
      // Sumar Stock
      const newStock = (product.stock || 0) + item.quantity
      await tx.update(Products, item.product_ID).with({ stock: newStock })

      // [TRAZABILIDAD] Registrar Movimiento en Kardex ligado al Comprador
      await tx.create(StockMovements).entries({
        product_ID: item.product_ID,
        type: 'IN',
        quantity: item.quantity,
        reference: `Compra ${order.orderNo || ID}`,
        responsible_ID: order.buyer_ID, // <--- AQUÍ LIGAMOS AL HUMANO
        date: new Date()
      })
    }

    // D) Cambiar estado
    await tx.update(PurchaseOrders, ID).with({ status: 'RECEIVED' })
    return tx.read(PurchaseOrders, ID)
  })

})