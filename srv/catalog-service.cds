using erp from '../db/schema';

service CatalogService @(path: '/catalog') {

  // ---------------------------------------------------------
  // DATOS MAESTROS
  // ---------------------------------------------------------
  entity Customers          as projection on erp.Customers;
  entity Products           as projection on erp.Products;
  entity Suppliers          as projection on erp.Suppliers; // Nuevo: Proveedores

  // ---------------------------------------------------------
  // INVENTARIO Y STOCK
  // ---------------------------------------------------------
  // Necesario para que tu módulo de Inventario lea el historial
  entity StockMovements     as projection on erp.StockMovements;

  // ---------------------------------------------------------
  // VENTAS (Sales)
  // ---------------------------------------------------------
  entity SalesOrders        as projection on erp.SalesOrders actions {
    action submit(); // Confirma la venta y descuenta stock
  };
  
  entity SalesOrderItems    as projection on erp.SalesOrderItems;

  // ---------------------------------------------------------
  // COMPRAS (Procurement) - NUEVO
  // ---------------------------------------------------------
  entity PurchaseOrders     as projection on erp.PurchaseOrders actions {
    action receive(); // Recibe la mercadería y aumenta stock
  };

  entity PurchaseOrderItems as projection on erp.PurchaseOrderItems;
}