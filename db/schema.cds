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
