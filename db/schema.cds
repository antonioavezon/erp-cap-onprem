namespace erp;

using {
  cuid,
  managed,
  Country,
  Currency
} from '@sap/cds/common';

/**
 * Clientes
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

/**
 * Catálogo de productos
 */
entity Products : cuid, managed {
  name         : String(120);
  description  : String(255);
  price        : Decimal(15,2);
  currency     : Currency;
  sku          : String(40);
  stock        : Integer default 0;
  isActive     : Boolean default true;
}

/**
 * Pedido de venta (cabecera)
 */
entity SalesOrders : cuid, managed {
  orderNo      : String(30);
  customer     : Association to Customers;
  orderDate    : Date;
  status       : String(20);

  items        : Composition of many SalesOrderItems
                   on items.order = $self;

  totalAmount  : Decimal(15,2);
  currency     : Currency;

  notes        : String(255);
}

/**
 * Ítem de pedido (detalle)
 */
entity SalesOrderItems : cuid, managed {
  order : Association to SalesOrders;

  product      : Association to Products;
  quantity     : Integer;
  unitPrice    : Decimal(15,2);
  lineAmount   : Decimal(15,2);
}

/**
 * Movimientos de Inventario
 */
entity StockMovements : cuid, managed {
  product     : Association to Products;
  type        : String(10); // 'IN' (Entrada) o 'OUT' (Salida)
  quantity    : Integer;
  reference   : String(50); // Ej: "Pedido de Venta 102" o "Carga Inicial"
  date        : DateTime default $now;
}


/*
   ==== Modulo de compras
 * Proveedores (Quienes nos abastecen)
 */
entity Suppliers : cuid, managed {
  name       : String(120);
  taxNumber  : String(30);
  email      : String(120);
  phone      : String(30);
  
  // Datos comerciales
  currency   : Currency;      // Moneda preferida
  paymentTerms : String(20);  // Ej: 30 días, Contado
  
  street     : String(120);
  city       : String(80);
  country    : Country;
  
  isActive   : Boolean default true;
}

/**
 * Pedido de Compra (Cabecera)
 */
entity PurchaseOrders : cuid, managed {
  orderNo     : String(30);
  supplier    : Association to Suppliers;
  orderDate   : Date;
  status      : String(20); // CREATED, RECEIVED, CANCELLED

  items       : Composition of many PurchaseOrderItems
                  on items.order = $self;

  totalAmount : Decimal(15,2);
  currency    : Currency;
  notes       : String(255);
}

/**
 * Ítems de Compra (Detalle)
 */
entity PurchaseOrderItems : cuid, managed {
  order      : Association to PurchaseOrders;
  product    : Association to Products;
  
  quantity   : Integer;
  unitCost   : Decimal(15,2); // Costo unitario (diferente al precio de venta)
  lineTotal  : Decimal(15,2);
}