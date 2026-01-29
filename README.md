# API Gestión de Envíos y Rutas Logísticas - Coordinadora

Microservicio backend para la gestión de cotización, generación y rastreo de envíos en tiempo real, desarrollado bajo los estándares de la plantilla  y principios de **Clean Architecture**.

---

##  Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
| :--- | :--- | :--- |
| **Node.js** | 18+ LTS | Runtime de JavaScript |
| **TypeScript** | 5.8 | Tipado estático y robustez |
| **Fastify** | 5.2 | Framework web de alto rendimiento |
| **PostgreSQL** | 15 | Base de datos relacional (Persistencia) |
| **Redis** | 7 | Caché en memoria (Tarifas y Consultas) |
| **InversifyJS** | 7.1 | Inyección de dependencias (DI) |
| **Joi** | 17.13 | Validación de esquemas de datos |
| **Swagger** | 9.4 | Documentación interactiva de API |
| **Jest** | 29.7 | Testing y Cobertura |

---

## Arquitectura del Proyecto

El proyecto implementa **Clean Architecture** para garantizar el desacoplamiento y la facilidad de mantenimiento:

```text
src/
├── application/          # Casos de uso y servicios de aplicación (HU1, HU2, HU4)
├── domain/               # Núcleo del negocio (Entidades, Reglas, Interfaces)
├── infrastructure/       # Implementaciones técnicas (API, Cache, Repositorios)
│   ├── api/              # Controladores, Rutas, Middlewares y Swagger
│   ├── cache/            # Implementación de Redis
│   └── repositories/     # Implementación de persistencia en Postgres
├── configuration/        # Configuración de DI (Inversify) y Tipos
└── util/                 # Utilidades (Logger, ENV, Validaciones)
```

---

## Instalación y Ejecución

### 1. Clonar y preparar

```bash
git clone https://github.com/OscarCalle0/Gestion-de-envios.git
cd Gestion-de-envios
yarn install
```

### 2. Configurar variables de entorno (.env)

Crea un archivo `.env` en la raíz con la siguiente configuración:

```env
NODE_ENV=development
DOMAIN=localhost
PORT=8080
HOST=0.0.0.0
PREFIX=/coordinadora/gestion-envios

DB_HOST=localhost
DB_PORT=5432
DB_USER=coordinadora_user
DB_PASSWORD=coordinadora_pass
DB_NAME=coordinadora_db

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=600

LOG_LEVEL=info
GCP_PROJECT=local-project
```

### 3. Iniciar servicios y servidor

```bash
docker-compose up -d  # Inicia PostgreSQL y Redis
yarn dev              # Inicia la API con hot-reload
```

---

## Documentación y Endpoints

Acceso a la interfaz de pruebas:
👉 **Swagger UI:** [http://127.0.0.1:8080/docs](http://127.0.0.1:8080/docs)

| HU | Descripción | Endpoint (Prefijo: `/coordinadora/gestion-envios`) | Método |
| :--- | :--- | :--- | :--- |
| **HU1** | Cotización de una orden de envío | `/cotizar` | `POST` |
| **HU2** | Creación de orden de envío | `/envios` | `POST` |
| **HU4** | Consulta de estado del envío | `/envios/:guia` | `GET` |
| **HU4** | Actualización de estado del envío | `/envios/:guia/estado` | `PATCH` |
| - | Consulta de tarifas generales | `/tarifas` | `GET` |

---

## Reglas de Negocio Implementadas

1. **Peso Volumétrico:** Se calcula mediante la fórmula: `Peso Volumétrico = (Alto * Ancho * Largo) / 2500`
2. **Peso Facturable:** Es el mayor entre el Peso Real y el Peso Volumétrico.
3. **Transición de Estados:** Secuencia lógica: *En espera → En tránsito → Entregado*.
4. **Formato de Guía:** Generación automática `DDMMYY + Consecutivo de 5 dígitos` (Ej: 28012600001).
5. **Caché:** Implementación de Redis para tarifas (TTL 10 min) con invalidación automática al actualizar estados.

---

## Testing y Cobertura (Métricas Reales)

| Capa / Módulo | % Líneas | % Funciones | Estado |
| :--- | :--- | :--- | :--- |
| **Total del Proyecto** | **81.8%** | **81.05%** | Aprobado |
| Servicios de Aplicación | **96.58%** | **95.0%** | Excelente |
| Entidades de Dominio | **100%** | **100%** | Excelente |
| Infraestructura API | **100%** | **100%** | Excelente |

**Comandos de Test:**

```bash
yarn test          # Ejecutar pruebas unitarias
yarn coverage      # Generar reporte de cobertura detallado
```

---

## Estructura de Base de Datos (Tablas)

| Tabla | Propósito |
| :--- | :--- |
| `tarifas` | Precios configurados por ruta y tipo de producto. |
| `envios` | Cabecera y datos principales de la orden. |
| `envio_unidades` | Detalle de bultos/paquetes por envío. |
| `envio_historial` | Trazabilidad completa de cambios de estado. |
| `guia_secuencia` | Control atómico de consecutivos para guías. |

---

## Características Pro

* **Health Checks:** Endpoints `/health`, `/health/ready` (Readiness Probe) y `/metrics` activos.
* **Logging Profesional:** Formato JSON para producción y legible para desarrollo mediante `Pino`.
* **Principios SOLID:** Aplicación estricta de Inversión de Dependencias y Responsabilidad Única.

---

**Autor:** Oscar Calle - Desarrollado para Coordinadora Mercantil S.A.
**Licencia:** Propiedad de Coordinadora Mercantil S.A.
