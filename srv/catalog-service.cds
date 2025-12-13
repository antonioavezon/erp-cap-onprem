using erp from '../db/schema';

service CatalogService @(path: '/catalog') {

  // ---------------------------------------------------------
  // DATOS MAESTROS (Generales)
  // ---------------------------------------------------------
  entity Customers          as projection on erp.Customers;
  entity Products           as projection on erp.Products;
  entity Suppliers          as projection on erp.Suppliers;
  // ---------------------------------------------------------
  // RECURSOS HUMANOS (HR) - NUEVO SPRINT 6
  // ---------------------------------------------------------
  // Gestión de personal
  entity Employees          as projection on erp.Employees;
  // Datos administrativos
  entity Contracts          as projection on erp.Contracts;
  // Finanzas personales
  entity Payrolls           as projection on erp.Payrolls;
  // ---------------------------------------------------------
  // INVENTARIO Y LOGÍSTICA
  // ---------------------------------------------------------
  entity StockMovements     as projection on erp.StockMovements;

  // ---------------------------------------------------------
  // VENTAS (Sales)
  // ---------------------------------------------------------
  entity SalesOrders        as projection on erp.SalesOrders
    actions {
      action submit(); // Confirma venta, descuenta stock
    };

  entity SalesOrderItems    as projection on erp.SalesOrderItems;

  // ---------------------------------------------------------
  // COMPRAS (Procurement)
  // ---------------------------------------------------------
  entity PurchaseOrders     as projection on erp.PurchaseOrders
    actions {
      action receive(); // Recibe mercadería, aumenta stock
    };

  entity PurchaseOrderItems as projection on erp.PurchaseOrderItems;
  // ---------------------------------------------------------
  // CONFIGURACIÓN (Settings)
  // ---------------------------------------------------------
  entity CompanySettings    as projection on erp.CompanySettings;
}
