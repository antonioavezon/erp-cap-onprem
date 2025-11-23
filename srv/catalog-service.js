// srv/catalog-service.js
const cds = require('@sap/cds')

module.exports = cds.service.impl(async function () {
  const { Products, SalesOrders, SalesOrderItems } = this.entities

  // 1) Regla para Products: precio > 0 y isActive por defecto
  this.before('CREATE', Products, (req) => {
    const { price, isActive } = req.data

    if (price == null || price <= 0) {
      return req.error(400, 'Price must be greater than zero')
    }

    if (isActive == null) {
      req.data.isActive = true
    }
  })

  // 2) Regla para items: calcular lineAmount = quantity * unitPrice
  this.before('CREATE', SalesOrderItems, (req) => {
    const { quantity, unitPrice } = req.data

    if (!quantity || quantity <= 0) {
      return req.error(400, 'Quantity must be greater than zero')
    }
    if (!unitPrice || unitPrice <= 0) {
      return req.error(400, 'Unit price must be greater than zero')
    }

    req.data.lineAmount = quantity * unitPrice
  })

  // 3) Mantener el total del pedido sincronizado
  this.after(
    ['CREATE', 'UPDATE', 'DELETE'],
    SalesOrderItems,
    async (items, req) => {
      const affected = Array.isArray(items) ? items : [items]
      const tx = cds.transaction(req)

      for (const item of affected) {
        const orderId = item.order_ID || item.order_id || item.order
        if (!orderId) continue

        const result = await tx.read(SalesOrderItems)
          .where({ order_ID: orderId })
          .columns(s => s.sum('lineAmount').as('total'))

        const total = (result[0] && result[0].total) || 0
        await tx.update(SalesOrders, orderId).with({ totalAmount: total })
      }
    }
  )

  // 4) Acción submit: no se puede confirmar un pedido sin ítems
  this.on('submit', SalesOrders, async (req) => {
    const { ID } = req.data
    const tx = cds.transaction(req)

    const count = await tx.read(SalesOrderItems)
      .where({ order_ID: ID })
      .count()

    if (!count) {
      return req.error(400, 'Cannot submit order without items')
    }

    await tx.update(SalesOrders, ID).with({ status: 'CONFIRMED' })
    return tx.read(SalesOrders, ID)
  })
})
