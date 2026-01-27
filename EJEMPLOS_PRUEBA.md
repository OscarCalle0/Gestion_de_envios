# Ejemplos de Prueba - API Gestión de Envíos y Rutas Logísticas

Este documento contiene ejemplos de JSON para probar todos los endpoints del microservicio.

## Configuración Inicial

### 1. Iniciar los Servicios (PostgreSQL + Redis)
```bash
docker-compose up -d
```

### 2. Verificar que los servicios estén corriendo
```bash
docker-compose ps
```

### 3. Iniciar el Servidor
```bash
yarn dev
```

### 4. Acceder a la Documentación Swagger
```
http://localhost:8080/docs
```

---

## Endpoints Disponibles

| Método | Endpoint | Descripción | Historia de Usuario |
|--------|----------|-------------|---------------------|
| POST | /coordinadora/gestion-envios/cotizar | Cotizar un envío | HU1 |
| POST | /coordinadora/gestion-envios/envios | Registrar un nuevo envío | HU2 |
| GET | /coordinadora/gestion-envios/envios/:guia | Consultar estado de un envío | HU4 |
| PATCH | /coordinadora/gestion-envios/envios/:guia/estado | Actualizar estado de un envío | HU4 |
| GET | /coordinadora/gestion-envios/tarifas | Consultar tabla de tarifas | HU1 (Criterio) |
| GET | /health | Health check básico | Monitoreo |
| GET | /health/ready | Health check detallado | Monitoreo |
| GET | /metrics | Métricas del servicio | Monitoreo |

---

## Endpoints de Monitoreo

### GET /health

**Descripción:** Health check básico para Kubernetes liveness probe.

```bash
curl -X GET http://localhost:8080/health
```

**Respuesta Esperada (200 OK):**
```json
{
    "status": "ok",
    "timestamp": "2026-01-23T10:30:00.000Z"
}
```

### GET /health/ready

**Descripción:** Health check detallado con estado de dependencias.

```bash
curl -X GET http://localhost:8080/health/ready
```

**Respuesta Esperada (200 OK):**
```json
{
    "status": "healthy",
    "timestamp": "2026-01-23T10:30:00.000Z",
    "uptime": 3600.5,
    "version": "1.0.0",
    "services": {
        "database": {
            "status": "up",
            "responseTime": 5
        },
        "redis": {
            "status": "up",
            "connected": true
        }
    }
}
```

**Respuesta Degradada (200 OK - Redis no disponible):**
```json
{
    "status": "degraded",
    "timestamp": "2026-01-23T10:30:00.000Z",
    "uptime": 3600.5,
    "version": "1.0.0",
    "services": {
        "database": {
            "status": "up",
            "responseTime": 5
        },
        "redis": {
            "status": "down",
            "connected": false
        }
    }
}
```

### GET /metrics

**Descripción:** Métricas básicas del servicio.

```bash
curl -X GET http://localhost:8080/metrics
```

**Respuesta Esperada (200 OK):**
```json
{
    "uptime": 3600.5,
    "memory": {
        "heapTotal": "50 MB",
        "heapUsed": "25 MB",
        "external": "5 MB",
        "rss": "80 MB"
    },
    "cpu": {
        "user": 1500000,
        "system": 500000
    },
    "timestamp": "2026-01-23T10:30:00.000Z"
}
```

---

## HU1: Cotización de Envío

### POST /coordinadora/gestion-envios/cotizar

**Descripción:** Calcula el valor de un envío basándose en peso, dimensiones y ruta.

#### Ejemplo 1: Cotización de Paquete Simple
```json
{
    "tipoProducto": "PAQUETE",
    "origen": "MEDELLIN",
    "destino": "BOGOTA",
    "unidades": [
        {
            "pesoReal": 5,
            "alto": 30,
            "ancho": 20,
            "largo": 40
        }
    ]
}
```

**Respuesta Esperada (200 OK):**
```json
{
    "isError": false,
    "data": {
        "tipoProducto": "PAQUETE",
        "ruta": "MEDELLIN - BOGOTA",
        "unidades": [
            {
                "pesoReal": 5,
                "alto": 30,
                "ancho": 20,
                "largo": 40,
                "pesoVolumetrico": 10,
                "pesoFacturable": 10
            }
        ],
        "valorTotalCotizacion": 50000,
        "moneda": "COP"
    }
}
```

#### Ejemplo 2: Cotización de Múltiples Unidades
```json
{
    "tipoProducto": "PAQUETE",
    "origen": "BOGOTA",
    "destino": "CALI",
    "unidades": [
        {
            "pesoReal": 3,
            "alto": 20,
            "ancho": 15,
            "largo": 25
        },
        {
            "pesoReal": 8,
            "alto": 40,
            "ancho": 30,
            "largo": 50
        }
    ]
}
```

#### Ejemplo 3: Cotización de Documento
```json
{
    "tipoProducto": "DOCUMENTO",
    "origen": "MEDELLIN",
    "destino": "BOGOTA",
    "unidades": [
        {
            "pesoReal": 0.5,
            "alto": 30,
            "ancho": 22,
            "largo": 1
        }
    ]
}
```

#### Ejemplo de Error: Ruta No Disponible
```json
{
    "tipoProducto": "PAQUETE",
    "origen": "PEREIRA",
    "destino": "MANIZALES",
    "unidades": [
        {
            "pesoReal": 5,
            "alto": 30,
            "ancho": 20,
            "largo": 40
        }
    ]
}
```

**Respuesta (400 Bad Request):**
```json
{
    "isError": true,
    "message": "No se encontró una tarifa para la ruta y tipo de producto especificados",
    "code": "BAD_MESSAGE",
    "statusCode": 400,
    "cause": "Ruta no encontrada"
}
```

---

## HU2: Registro de Envío

### POST /coordinadora/gestion-envios/envios

**Descripción:** Registra un nuevo envío en el sistema con estado inicial "En espera".

#### Ejemplo 1: Registro Completo de Paquete
```json
{
    "tipoProducto": "PAQUETE",
    "origen": "MEDELLIN",
    "destino": "BOGOTA",
    "valorDeclarado": 500000,
    "metodoPago": "FLETE_PAGO",
    "unidades": [
        {
            "pesoReal": 5,
            "alto": 30,
            "ancho": 20,
            "largo": 40
        }
    ],
    "remitente": {
        "nombre": "Juan Carlos Pérez López",
        "direccion": "Calle 10 #20-30, Barrio El Poblado, Medellín",
        "telefono": "3001234567"
    },
    "destinatario": {
        "nombre": "María García Rodríguez",
        "direccion": "Carrera 15 #45-67, Chapinero, Bogotá",
        "telefono": "3109876543",
        "infoAdicional": "Apartamento 301, Torre B, Conjunto Residencial Los Pinos"
    }
}
```

**Respuesta Esperada (201 Created):**
```json
{
    "isError": false,
    "data": {
        "mensaje": "Envío registrado exitosamente",
        "id": "ENV-1706012345678-abc123",
        "numeroGuia": "23012600001",
        "estado": "En espera",
        "ruta": "MEDELLIN - BOGOTA",
        "tipoProducto": "PAQUETE",
        "valorTotal": 50000,
        "moneda": "COP",
        "unidades": [
            {
                "pesoReal": 5,
                "dimensiones": "30x20x40 cm",
                "pesoVolumetrico": 10,
                "pesoFacturable": 10
            }
        ]
    }
}
```

#### Ejemplo 2: Registro con Valor de Cotización Previo
```json
{
    "tipoProducto": "PAQUETE",
    "origen": "BOGOTA",
    "destino": "CALI",
    "valorDeclarado": 1000000,
    "metodoPago": "CONTRA_ENTREGA",
    "valorCotizacion": 75000,
    "unidades": [
        {
            "pesoReal": 10,
            "alto": 50,
            "ancho": 40,
            "largo": 60
        }
    ],
    "remitente": {
        "nombre": "Empresa XYZ S.A.S",
        "direccion": "Zona Industrial, Bodega 15, Bogotá",
        "telefono": "6012345678"
    },
    "destinatario": {
        "nombre": "Distribuidora ABC",
        "direccion": "Calle 5 #10-20, Cali",
        "telefono": "6029876543"
    }
}
```

#### Ejemplo 3: Registro de Documento
```json
{
    "tipoProducto": "DOCUMENTO",
    "origen": "BARRANQUILLA",
    "destino": "BOGOTA",
    "valorDeclarado": 50000,
    "metodoPago": "RECAUDO",
    "unidades": [
        {
            "pesoReal": 0.3,
            "alto": 30,
            "ancho": 22,
            "largo": 1
        }
    ],
    "remitente": {
        "nombre": "Notaría Primera de Barranquilla",
        "direccion": "Carrera 45 #72-120, Barranquilla",
        "telefono": "6053456789"
    },
    "destinatario": {
        "nombre": "Juzgado Tercero Civil",
        "direccion": "Calle 12 #8-30, Centro, Bogotá",
        "telefono": "6017654321"
    }
}
```

---

## HU4: Seguimiento del Estado del Envío

### GET /coordinadora/gestion-envios/envios/:guia

**Descripción:** Consulta el estado actual y el historial de un envío.

#### Ejemplo de Consulta
```bash
curl -X GET http://localhost:8080/coordinadora/gestion-envios/envios/23012600001
```

**Respuesta Esperada (200 OK):**
```json
{
    "isError": false,
    "data": {
        "numeroGuia": "23012600001",
        "estado": "En espera",
        "tipoProducto": "PAQUETE",
        "ruta": {
            "origen": "MEDELLIN",
            "destino": "BOGOTA"
        },
        "remitente": {
            "nombre": "Juan Carlos Pérez López",
            "direccion": "Calle 10 #20-30, Barrio El Poblado, Medellín",
            "telefono": "3001234567"
        },
        "destinatario": {
            "nombre": "María García Rodríguez",
            "direccion": "Carrera 15 #45-67, Chapinero, Bogotá",
            "telefono": "3109876543",
            "infoAdicional": "Apartamento 301, Torre B"
        },
        "valorTotal": 50000,
        "moneda": "COP",
        "metodoPago": "FLETE_PAGO",
        "unidades": [
            {
                "pesoReal": 5,
                "dimensiones": "30x20x40 cm",
                "pesoVolumetrico": 10,
                "pesoFacturable": 10
            }
        ],
        "historialEstados": [
            {
                "estadoAnterior": null,
                "estadoNuevo": "En espera",
                "ubicacion": null,
                "observacion": "Envío registrado en el sistema",
                "fecha": "2026-01-23T10:30:00.000Z"
            }
        ],
        "fromCache": false,
        "fechaCreacion": "2026-01-23T10:30:00.000Z",
        "fechaActualizacion": "2026-01-23T10:30:00.000Z"
    }
}
```

**Nota:** El campo `fromCache: true` indica que la respuesta proviene del caché de Redis.

#### Ejemplo de Error: Guía No Encontrada
```bash
curl -X GET http://localhost:8080/coordinadora/gestion-envios/envios/99999999999
```

**Respuesta (400 Bad Request):**
```json
{
    "isError": true,
    "message": "No se encontró ningún envío con la guía: 99999999999",
    "code": "BAD_MESSAGE",
    "statusCode": 400,
    "cause": "Guía no encontrada"
}
```

---

### PATCH /coordinadora/gestion-envios/envios/:guia/estado

**Descripción:** Actualiza el estado de un envío siguiendo la secuencia: En espera → En tránsito → Entregado

#### Ejemplo 1: Cambiar a "En tránsito"
```bash
curl -X PATCH http://localhost:8080/coordinadora/gestion-envios/envios/23012600001/estado \
  -H "Content-Type: application/json" \
  -d '{"estado": "En tránsito", "ubicacion": "Centro de distribución Bogotá", "observacion": "Paquete recibido en bodega"}'
```

```json
{
    "estado": "En tránsito",
    "ubicacion": "Centro de distribución Bogotá",
    "observacion": "Paquete recibido en bodega, listo para distribución"
}
```

**Respuesta Esperada (200 OK):**
```json
{
    "isError": false,
    "data": {
        "numeroGuia": "23012600001",
        "estadoAnterior": "En espera",
        "estadoActual": "En tránsito",
        "mensaje": "Estado actualizado correctamente de \"En espera\" a \"En tránsito\"",
        "historialEstados": [
            {
                "estadoAnterior": null,
                "estadoNuevo": "En espera",
                "ubicacion": null,
                "observacion": "Envío registrado en el sistema",
                "fecha": "2026-01-23T10:30:00.000Z"
            },
            {
                "estadoAnterior": "En espera",
                "estadoNuevo": "En tránsito",
                "ubicacion": "Centro de distribución Bogotá",
                "observacion": "Paquete recibido en bodega, listo para distribución",
                "fecha": "2026-01-23T14:45:00.000Z"
            }
        ],
        "fechaActualizacion": "2026-01-23T14:45:00.000Z"
    }
}
```

#### Ejemplo 2: Cambiar a "Entregado"
```json
{
    "estado": "Entregado",
    "ubicacion": "Carrera 15 #45-67, Chapinero, Bogotá",
    "observacion": "Entregado a María García - Recibido conforme"
}
```

#### Ejemplo de Error: Transición No Permitida
```json
{
    "estado": "Entregado"
}
```

**Respuesta (400 Bad Request) - Si el estado actual es "En espera":**
```json
{
    "isError": true,
    "message": "No se puede cambiar de \"En espera\" a \"Entregado\". La secuencia válida es: En espera → En tránsito → Entregado",
    "code": "BAD_MESSAGE",
    "statusCode": 400,
    "cause": "Transición de estado no permitida"
}
```

---

## Consulta de Tarifas

### GET /coordinadora/gestion-envios/tarifas

**Descripción:** Obtiene todas las tarifas disponibles para cotización.

```bash
curl -X GET http://localhost:8080/coordinadora/gestion-envios/tarifas
```

**Respuesta Esperada (200 OK):**
```json
{
    "isError": false,
    "data": {
        "totalTarifas": 15,
        "moneda": "COP",
        "descripcion": "Tarifas por kilogramo facturable...",
        "fromCache": true,
        "tarifas": [
            {
                "origen": "MEDELLIN",
                "destino": "BOGOTA",
                "productos": [
                    {
                        "tipoProducto": "PAQUETE",
                        "precioBase": 5000,
                        "factorVolumetrico": 2500
                    },
                    {
                        "tipoProducto": "DOCUMENTO",
                        "precioBase": 8000,
                        "factorVolumetrico": 2500
                    }
                ]
            }
        ],
        "tarifasDetalle": [...]
    }
}
```

**Nota:** El campo `fromCache: true` indica que la respuesta proviene del caché de Redis.

---

## Flujo Completo de Prueba

### Paso 1: Verificar Health Check
```bash
curl -X GET http://localhost:8080/health/ready
```

### Paso 2: Consultar Tarifas Disponibles
```bash
curl -X GET http://localhost:8080/coordinadora/gestion-envios/tarifas
```

### Paso 3: Cotizar un Envío
```bash
curl -X POST http://localhost:8080/coordinadora/gestion-envios/cotizar \
  -H "Content-Type: application/json" \
  -d '{
    "tipoProducto": "PAQUETE",
    "origen": "MEDELLIN",
    "destino": "BOGOTA",
    "unidades": [{"pesoReal": 5, "alto": 30, "ancho": 20, "largo": 40}]
  }'
```

### Paso 4: Registrar el Envío
```bash
curl -X POST http://localhost:8080/coordinadora/gestion-envios/envios \
  -H "Content-Type: application/json" \
  -d '{
    "tipoProducto": "PAQUETE",
    "origen": "MEDELLIN",
    "destino": "BOGOTA",
    "valorDeclarado": 500000,
    "metodoPago": "FLETE_PAGO",
    "unidades": [{"pesoReal": 5, "alto": 30, "ancho": 20, "largo": 40}],
    "remitente": {"nombre": "Juan Pérez", "direccion": "Calle 10 #20-30", "telefono": "3001234567"},
    "destinatario": {"nombre": "María García", "direccion": "Carrera 15 #45-67", "telefono": "3109876543"}
  }'
```

### Paso 5: Consultar Estado del Envío
```bash
curl -X GET http://localhost:8080/coordinadora/gestion-envios/envios/23012600001
```

### Paso 6: Actualizar Estado a "En tránsito"
```bash
curl -X PATCH http://localhost:8080/coordinadora/gestion-envios/envios/23012600001/estado \
  -H "Content-Type: application/json" \
  -d '{"estado": "En tránsito", "ubicacion": "Centro de distribución Bogotá"}'
```

### Paso 7: Actualizar Estado a "Entregado"
```bash
curl -X PATCH http://localhost:8080/coordinadora/gestion-envios/envios/23012600001/estado \
  -H "Content-Type: application/json" \
  -d '{"estado": "Entregado", "ubicacion": "Dirección destino", "observacion": "Entregado conforme"}'
```

### Paso 8: Verificar Métricas
```bash
curl -X GET http://localhost:8080/metrics
```

---

## Reglas de Negocio Implementadas

### Cálculo del Peso Volumétrico
```
Peso Volumétrico = (Alto × Ancho × Largo) / 2500
```
- Las dimensiones se redondean al entero superior
- El resultado se redondea al entero superior

### Peso Facturable
```
Peso Facturable = MAX(Peso Real, Peso Volumétrico)
```

### Valor de Cotización
```
Valor Total = Σ (Peso Facturable de cada unidad × Precio Base de la tarifa)
```

### Transiciones de Estado Válidas
```
En espera → En tránsito → Entregado
```
- No se puede saltar estados
- No se puede retroceder estados

### Formato de Número de Guía
```
DDMMYY + Consecutivo de 5 dígitos
Ejemplo: 23012600001 (23/01/26, envío #1 del día)
```

---

## Caché Redis

### Claves de Caché

| Patrón | TTL | Descripción |
|--------|-----|-------------|
| `tarifas:all` | 10 min | Todas las tarifas |
| `tarifa:{origen}:{destino}:{tipo}` | 10 min | Tarifa específica |
| `envio:{guia}` | 1 min | Datos de un envío |

### Invalidación

- Al actualizar el estado de un envío, se invalida automáticamente su caché
- Las tarifas se refrescan cada 10 minutos
