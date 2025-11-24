namespace erp;

using {
  cuid,
  managed,
  Country,
  Currency
} from '@sap/cds/common';

/**
 * ===========================================================
 * MÓDULO DE MAESTROS (Base/**
 * ===========================================================
*/

entity Customers : cuid, managed {
  name         : String(120);
  taxNumber    : String(30);          // RUT / VAT / NIF
  email        : String(120);
  phone        : String(30);
  street       : String(120);
  city         : String(80);
  postalCode   : String(20);
  country      : Country;
  isActive     : Boolean default true;
}

entity Products : cuid, managed {
  name         : String(120);
  description  : String(255);
  price        : Decimal(15,2);
  currency     : Currency;
  sku          : String(40);
  stock        : Integer default 0;   // Stock actual
  isActive     : Boolean default true;
}

/**
 * ===========================================================
 * MÓDULO DE RECURSOS HUMANOS (HR) 
 * ===========================================================
/**
 * Ficha del Colaborador
 */
entity Employees : cuid, managed {
  rut          : String(20);          // Identificador único nacional
  firstName    : String(80);
  lastName     : String(80);
  email        : String(120);
  phone        : String(30);
  
  // Roles del sistema: 'SALES' (Vendedor), 'WAREHOUSE' (Bodega), 'ADMIN'
  role         : String(20); 
  
  isActive     : Boolean default true;

  // Relación 1 a 1 lógica con contrato vigente
  contract     : Association to one Contracts on contract.employee = $self;
}

/**
 * Datos Contractuales y Bancarios
 */
entity Contracts : cuid, managed {
  employee     : Association to Employees;
  startDate    : Date;
  endDate      : Date;                // Null si es indefinido
  
  // Datos Financieros
  baseSalary   : Decimal(15,2);       // Sueldo Base
  currency     : Currency;
  
  // Datos Previsionales (Chile)
  afp          : String(50);          // Ej: Modelo, Habitat
  healthSystem : String(50);          // Ej: Fonasa, Isapre Cruz Blanca
  
  // Datos Bancarios
  bankName     : String(50);
  bankAccount  : String(50);
  accountType  : String(20);          // Ej: Vista, Corriente
}

/**
 * Liquidaciones de Sueldo (Nómina)
 */
entity Payrolls : cuid, managed {
  employee       : Association to Employees;
  period         : String(7);         // YYYY-MM (Ej: 2023-11)
  
  // Cálculo
  baseSalary     : Decimal(15,2);     // Base del mes
  overtimeHours  : Decimal(5,2);      // Cantidad HHEE
  overtimeAmount : Decimal(15,2);     // Monto HHEE
  bonuses        : Decimal(15,2);     // Bonos (Ventas, etc)
  discounts      : Decimal(15,2);     // AFP + Salud + Otros
  
  totalLiquid    : Decimal(15,2);     // A Pagar
  
  isPaid         : Boolean default false;
  paymentDate    : Date;
}

/**
 * ===========================================================
 * MÓDULO DE VENTAS (Sales)
 * ===========================================================
 */

entity SalesOrders : cuid, managed {
  orderNo      : String(30);
  customer     : Association to Customers;
  
  // TRAZABILIDAD: ¿Quién vendió esto? (Para comisiones)
  salesPerson  : Association to Employees; 
  
  orderDate    : Date;
  status       : String(20);
  items        : Composition of many SalesOrderItems on items.order = $self;
  totalAmount  : Decimal(15,2);
  currency     : Currency;
  notes        : String(255);
}

entity SalesOrderItems : cuid, managed {
  order        : Association to SalesOrders;
  product      : Association to Products;
  quantity     : Integer;
  unitPrice    : Decimal(15,2);
  lineAmount   : Decimal(15,2);
}

/**
 * ===========================================================
 * MÓDULO DE COMPRAS (Procurement)
 * ===========================================================
 */

entity Suppliers : cuid, managed {
  name         : String(120);
  taxNumber    : String(30);
  email        : String(120);
  phone        : String(30);
  currency     : Currency;
  paymentTerms : String(20);
  street       : String(120);
  city         : String(80);
  country      : Country;
  isActive     : Boolean default true;
}

entity PurchaseOrders : cuid, managed {
  orderNo      : String(30);
  supplier     : Association to Suppliers;
  buyer       : Association to Employees;
  orderDate    : Date;
  status       : String(20);
  items        : Composition of many PurchaseOrderItems on items.order = $self;
  totalAmount  : Decimal(15,2);
  currency     : Currency;
  notes        : String(255);
}

entity PurchaseOrderItems : cuid, managed {
  order        : Association to PurchaseOrders;
  product      : Association to Products;
  quantity     : Integer;
  unitCost     : Decimal(15,2);
  lineTotal    : Decimal(15,2);
}

/**
 * ===========================================================
 * MÓDULO DE LOGÍSTICA (Inventory)
 * ===========================================================
 */

entity StockMovements : cuid, managed {
  product      : Association to Products;
  type         : String(10); // IN/OUT
  quantity     : Integer;
  reference    : String(50);
  
  // TRAZABILIDAD: ¿Quién movió la mercadería? (Bodeguero)
  responsible  : Association to Employees; 
  
  date         : DateTime default $now;
}

/**
 * ===========================================================
 * MÓDULO DE CONFIGURACIÓN (Settings) - SPRINT 6.5
 * ===========================================================
 */

entity CompanySettings : managed {
  key ID       : String(1) default '1'; // Siempre será el registro '1'
  name         : String(120);           // Nombre de Fantasía (ej: Mi Tienda)
  businessName : String(120);           // Razón Social (ej: Inversiones SpA)
  taxNumber    : String(30);            // RUT empresa
  address      : String(200);
  contactEmail : String(120);
  currency     : Currency;              // Moneda base del sistema
  logoUrl      : String(255);           // URL de la imagen del logo
}

/**
 * ===========================================================
 * MÓDULO DE SEGURIDAD (Auth)
 * ===========================================================
 */
entity AppUsers : cuid, managed {
  username     : String(50);
  password     : String(100);
  systemRole   : String(20);
  employee     : Association to Employees; 
  isActive     : Boolean default true;
}
