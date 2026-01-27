# API Gestión de Envíos y Rutas Logísticas - Coordinadora

Microservicio backend para la gestión de cotización, generación y rastreo de envíos en tiempo real, desarrollado siguiendo la plantilla corporativa Sigo_Dineros de Coordinadora.

## Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js** | 18+ LTS | Runtime de JavaScript |
| **TypeScript** | 5.8 | Tipado estático |
| **Fastify** | 5.2 | Framework web de alto rendimiento |
| **PostgreSQL** | 15 | Base de datos relacional |
| **Redis** | 7 | Caché en memoria |
| **InversifyJS** | 7.1 | Inyección de dependencias |
| **Joi** | 17.13 | Validación de datos |
| **Swagger** | 9.4 | Documentación de API |
| **Docker** | - | Contenedorización |
| **Jest** | 29.7 | Testing |

## Arquitectura

El proyecto implementa **Clean Architecture** con las siguientes capas:

```
src/
├── application/          # Casos de uso y servicios de aplicación
│   ├── services/         # Servicios que orquestan la lógica de negocio
│   └── data/             # DTOs y estructuras de datos
├── domain/               # Núcleo del negocio
│   ├── entities/         # Entidades del dominio
│   ├── repository/       # Interfaces de repositorios
│   ├── exceptions/       # Excepciones personalizadas
│   └── response/         # Estructuras de respuesta
├── infrastructure/       # Implementaciones técnicas
│   ├── api/              # Controladores, rutas y middlewares
│   │   ├── routers/      # Definición de endpoints
│   │   ├── validate/     # Validaciones con Joi
│   │   ├── swagger/      # Configuración de documentación
│   │   └── middlewares/  # Middlewares de la aplicación
│   ├── cache/            # Implementación de Redis
│   └── repositories/     # Implementación de repositorios
├── configuration/        # Configuración de DI y tipos
└── util/                 # Utilidades (Logger, ENV, etc.)
```

## Historias de Usuario Implementadas

| HU | Descripción | Endpoint | Método |
|----|-------------|----------|--------|
| **HU1** | Cotización de una orden de envío | `/cotizar` | POST |
| **HU2** | Creación de orden de envío | `/envios` | POST |
| **HU4** | Consulta de estado del envío | `/envios/:guia` | GET |
| **HU4** | Actualización de estado del envío | `/envios/:guia/estado` | PATCH |
| - | Consulta de tarifas | `/tarifas` | GET |

## Características Adicionales

### Redis Cache
- Caché de tarifas (TTL: 10 minutos)
- Caché de consultas de envíos (TTL: 1 minuto)
- Invalidación automática al actualizar estados
- Graceful degradation si Redis no está disponible

### Health Checks
- `GET /health` - Liveness probe básico
- `GET /health/ready` - Readiness probe con estado de dependencias
- `GET /metrics` - Métricas de memoria y CPU

### Logging Profesional
- Formato JSON en producción
- Formato legible en desarrollo
- Niveles: DEBUG, INFO, WARN, ERROR

## Requisitos Previos

- Node.js v18+ (LTS)
- Yarn
- Docker y Docker Compose

## Instalación

### 1. Clonar el repositorio e instalar dependencias

```bash
yarn install
```

### 2. Configurar variables de entorno

Copiar el archivo de ejemplo y ajustar según sea necesario:

```bash
cp .env.example .env
```

Variables principales:
```env
# Servidor
NODE_ENV=local
DOMAIN=coordinadora
SERVICE_NAME=gestion-envios
PORT=8080

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=coordinadora_user
DB_PASSWORD=coordinadora_pass
DB_NAME=coordinadora_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=300
```

### 3. Iniciar los servicios (PostgreSQL y Redis)

```bash
docker-compose up -d
```

### 4. Iniciar el servidor en modo desarrollo

```bash
yarn dev
```

## Acceso a la Aplicación

| Recurso | URL |
|---------|-----|
| **API Base** | http://localhost:8080/coordinadora/gestion-envios |
| **Swagger UI** | http://localhost:8080/docs |
| **Health Check** | http://localhost:8080/health |
| **Readiness** | http://localhost:8080/health/ready |
| **Métricas** | http://localhost:8080/metrics |

## Endpoints Disponibles

### Cotización (HU1)
```
POST /coordinadora/gestion-envios/cotizar
```

### Registro de Envío (HU2)
```
POST /coordinadora/gestion-envios/envios
```

### Consulta de Envío (HU4)
```
GET /coordinadora/gestion-envios/envios/:guia
```

### Actualización de Estado (HU4)
```
PATCH /coordinadora/gestion-envios/envios/:guia/estado
```

### Consulta de Tarifas
```
GET /coordinadora/gestion-envios/tarifas
```

## Reglas de Negocio

### Cálculo de Peso Volumétrico
```
Peso Volumétrico = ceil(Alto × Ancho × Largo / 2500)
```

### Peso Facturable
```
Peso Facturable = MAX(Peso Real, Peso Volumétrico)
```

### Estados de Envío
La transición de estados sigue la secuencia:
```
En espera → En tránsito → Entregado
```

### Formato de Guía
```
DDMMYY + Consecutivo de 5 dígitos
Ejemplo: 23012600001
```

## Scripts Disponibles

```bash
# Desarrollo con hot-reload
yarn dev

# Compilar el proyecto
yarn build

# Ejecutar en producción
yarn start

# Ejecutar tests
yarn test

# Ejecutar tests con cobertura
yarn coverage

# Ejecutar linter
yarn lint

# Formatear código
yarn format
```

## Estructura de Base de Datos

### Tablas Principales

| Tabla | Propósito |
|-------|-----------|
| `tarifas` | Configuración de precios por ruta y tipo de producto |
| `envios` | Información de los envíos registrados |
| `envio_unidades` | Detalle de paquetes por envío |
| `envio_historial` | Historial de cambios de estado |
| `guia_secuencia` | Control de números de guía consecutivos |

## Testing

```bash
# Ejecutar todos los tests
yarn test

# Ejecutar con cobertura
yarn coverage
```

**Cobertura actual:**
- 35 tests pasando
- Cobertura de lógica de dominio: 100%
- Tests de reglas de negocio para HU1, HU2, HU4

## Ejemplos de Prueba

Ver el archivo [EJEMPLOS_PRUEBA.md](./EJEMPLOS_PRUEBA.md) para ejemplos detallados de JSON para cada endpoint.

## Cumplimiento de Requisitos

Ver el archivo [CUMPLIMIENTO_REQUISITOS.md](./CUMPLIMIENTO_REQUISITOS.md) para el detalle de cumplimiento de cada criterio de aceptación.

## Principios SOLID Aplicados

| Principio | Implementación |
|-----------|----------------|
| **S** - Single Responsibility | Cada servicio tiene una única responsabilidad |
| **O** - Open/Closed | Extensible mediante interfaces y abstracciones |
| **L** - Liskov Substitution | Los repositorios implementan interfaces del dominio |
| **I** - Interface Segregation | Interfaces específicas para cada operación |
| **D** - Dependency Inversion | Inversión de dependencias mediante InversifyJS |

## Recomendaciones del Reto Cumplidas

| Recomendación | Estado |
|---------------|--------|
| Código limpio y estructurado aplicando principios SOLID | ✅ |
| Uso adecuado de NodeJS y TypeScript | ✅ |
| Eficiencia en las consultas y uso de Redis | ✅ |
| Documentación de los servicios con Swagger | ✅ |
| Pruebas unitarias o de integración con buena cobertura | ✅ |

## Autor

Desarrollado siguiendo la plantilla corporativa de Coordinadora Mercantil S.A.

## Licencia

Propiedad de Coordinadora Mercantil S.A.
