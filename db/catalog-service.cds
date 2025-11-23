using { erp } from '../db/schema';

service CatalogService @(path : '/catalog') {

  entity Customers
    as projection on erp.Customers;

  entity Products
    as projection on erp.Products;

  entity SalesOrders
    as projection on erp.SalesOrders;

}
