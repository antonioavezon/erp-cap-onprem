# ERP CAP On-Prem

Mini ERP educativo basado en **SAP Cloud Application Programming Model (CAP)**, ejecutado **100% on-premise** con **Docker** y **PostgreSQL**.  
Su objetivo es servir como laboratorio de arquitectura backend, modelos de dominio y despliegue containerizado.

## Objetivo del proyecto

Diseñar y desplegar un servicio ERP básico con tres dominios clave:

- `Customers` – gestión de clientes  
- `Products` – catálogo de productos  
- `SalesOrders` – pedidos de venta (cabecera + ítems)

Aplicando buenas prácticas de:

- SAP CAP (CDS, servicios, handlers)  
- Arquitectura de microservicios ligera (APP + DB)  
- Orquestación con Docker Compose  
- Gestión de proyecto (PMP + enfoque ágil)

## Arquitectura

- **APP (`erp-core`)**
  - Node.js + CAP
  - Servicios OData para Customers, Products y SalesOrders
  - UIs Fiori/Fiori Elements para CRUD y gestión básica

- **DB (`db`)**
  - PostgreSQL 16 (imagen `postgres:16-alpine`)
  - Datos persistidos en volumen Docker

- **Orquestación**
  - `docker-compose.yml`
  - Red interna `erpnet`
  - Volumen `erpdb_data` para la base de datos

## Stack tecnológico

- SAP Cloud Application Programming Model (**CAP**, Node.js)
- **PostgreSQL** como base de datos
- **Docker** + **Docker Compose**
- **Fiori / Fiori Elements** para las vistas
- **GitHub** como repositorio remoto

## Requisitos

- Docker y Docker Compose instalados
- Node.js (para desarrollo local fuera de contenedores, opcional)
- Acceso a línea de comandos (Linux recomendado)

## Puesta en marcha rápida


# 1. Clonar el repositorio
```bash
git clone git@github.com:TU_USUARIO/erp-cap-onprem.git
cd erp-cap-onprem
```

# 2. (opcional, fuera de Docker) instalar dependencias
```bash
npm install
```

# 3. Construir imágenes
```bash
docker-compose build
```

# 4. Levantar entorno
```bash
docker-compose up
```

Acceso:

App CAP / servicios: 
```bash
http://localhost:4004
```

## Estructura del proyecto
db/         # Modelos CDS (Customer, Product, SalesOrder, SalesOrderItem)
srv/        # Servicios CAP (CatalogService, SalesService, lógica negocio)
app/        # UIs Fiori / Fiori Elements
Dockerfile  # Imagen para erp-core
docker-compose.yml
README.md
LICENSE

## Roadmap funcional (MVP)

 Sprint 1: Infra CAP + Docker + Postgres operativa

 Sprint 2: Modelo de datos (Customers, Products, SalesOrders)

 Sprint 3: Servicios de dominio y reglas de negocio básicas

 Sprint 4: Vistas Fiori y refinamiento

## Licencia

Este proyecto se encuentra bajo licencia MIT.
Ver archivo LICENSE
 para más detalles.

### Cómo lo sumas al repo

**Opción GitHub Web** (la más rápida ahora):

1. En el repo → **Add file → Create new file**.  
2. Nombre: `README.md`.  
3. Pega el contenido anterior y ajusta `TU_USUARIO`.  
4. Commit directo a `main`.

**Opción Fedora:**

```bash
cd ~/projects/erp-cap-onprem
nano README.md   # pegas y editas
git add README.md
git commit -m "docs: add project README"
git push
```
