# Ejemplos de Prueba y Flujo de Endpoints

Este documento contiene **todos** los JSONs de entrada y salida necesarios para probar cada endpoint del microservicio de Gestión de Envíos y Rutas Logísticas. Sirve como guía para la validación manual y complementa la documentación técnica del `README.md`.

---

## Tabla de Endpoints

| Método | Endpoint | Descripción | Historia de Usuario |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Health check básico | Monitoreo |
| `GET` | `/health/ready` | Health check con dependencias | Monitoreo |
| `GET` | `/metrics` | Métricas del servicio | Monitoreo |
| `GET` | `/coordinadora/gestion-envios/tarifas` | Consultar tarifas | HU1 |
| `POST` | `/coordinadora/gestion-envios/cotizar` | Cotizar un envío | HU1 |
| `POST` | `/coordinadora/gestion-envios/envios` | Registrar un envío | HU2 |
| `GET` | `/coordinadora/gestion-envios/envios/:guia` | Consultar estado | HU4 |
| `PATCH` | `/coordinadora/gestion-envios/envios/:guia/estado` | Actualizar estado | HU4 |

---

## 1. Endpoints de Monitoreo

### 1.1. Health Check Básico

**Endpoint:** `GET /health`
**Propósito:** Verifica que el servidor está en funcionamiento.

**Respuesta esperada (200 OK):**
```json
{
"status": "ok",
"timestamp": "2026-01-23T14:30:00.000Z"
}
```

### 1.2. Health Check Detallado (Readiness Probe)

**Endpoint:** `GET /health/ready`
**Propósito:** Verifica la salud del servicio y sus dependencias críticas (DB y Redis).

**Respuesta esperada (200 OK):**
```json
{
"status": "healthy",
"timestamp": "2026-01-23T14:30:00.000Z",
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

### 1.3. Métricas

**Endpoint:** `GET /metrics`
**Propósito:** Proporciona métricas de rendimiento del servicio.

**Respuesta esperada (200 OK):**
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
"timestamp": "2026-01-23T14:30:00.000Z"
}
```

---

## 2. Consultar Tarifas

**Endpoint:** `GET /coordinadora/gestion-envios/tarifas`
**Propósito:** Obtiene la lista de tarifas configuradas por ruta y tipo de producto.

**Respuesta esperada (200 OK):**
```json
{
"isError": false,
"data": {
"totalTarifas": 15,
"moneda": "COP",
"descripcion": "Tarifas por kilogramo facturable...",
"fromCache": false,
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
"tarifasDetalle": [
{
"id": 1,
"origen": "MEDELLIN",
"destino": "BOGOTA",
"tipoProducto": "PAQUETE",
"precioBase": 5000,
"factorVolumetrico": 2500
}
]
}
}
```

---

## 3. Cotizar Envío (HU1)

**Endpoint:** `POST /coordinadora/gestion-envios/cotizar`
**Propósito:** Calcula el costo total de un envío aplicando la regla de negocio del peso facturable.

### 3.1. Cotización Exitosa - Paquete Simple

**JSON del Body:**
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
**Respuesta esperada (200 OK):**
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
**Explicación del cálculo:**
*   Peso Volumétrico = (30 × 20 × 40) / 2500 = 9.6 → redondeado a **10**
*   Peso Facturable = MAX(Peso Real: 5, Peso Volumétrico: 10) = **10**
*   Valor Total = 10 kg × $5,000 (tarifa) = **$50,000**

### 3.2. Cotización Exitosa - Múltiples Unidades

**JSON del Body:**
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
**Respuesta esperada (200 OK):**
```json
{
"isError": false,
"data": {
"tipoProducto": "PAQUETE",
"ruta": "BOGOTA - CALI",
"unidades": [
{
"pesoReal": 3,
"alto": 20,
"ancho": 15,
"largo": 25,
"pesoVolumetrico": 3,
"pesoFacturable": 3
},
{
"pesoReal": 8,
"alto": 40,
"ancho": 30,
"largo": 50,
"pesoVolumetrico": 24,
"pesoFacturable": 24
}
],
"valorTotalCotizacion": 162000,
"moneda": "COP"
}
}
```

### 3.3. Cotización Exitosa - Documento

**JSON del Body:**
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
}]
}
```

### 3.4. Error - Ruta No Disponible

**Propósito:** Demuestra la validación de negocio cuando la ruta no está configurada en las tarifas.
**JSON del Body:**
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
**Respuesta esperada (400 Bad Request):**
```json
{
"isError": true,
"message": "No se encontró una tarifa para la ruta y tipo de producto especificado",
"code": "BAD_MESSAGE",
"statusCode": 400,
"cause": "Ruta no encontrada"
}
```

---

## 4. Registrar Envío (HU2)

**Endpoint:** `POST /coordinadora/gestion-envios/envios`
**Propósito:** Registra un nuevo envío en el sistema, calcula el costo final y genera un número de guía único.

### 4.1. Registro Exitoso - Paquete Completo

**JSON del Body:**
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
"infoAdicional": "Apartamento 301, Torre B"
}
}
```
**Respuesta esperada (201 Created):**
*Nota: El `numeroGuia` será generado automáticamente y debe ser usado en las pruebas de consulta y actualización.*
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

### 4.2. Registro con Cotización Previa

**JSON del Body:**
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

### 4.3. Registro de Documento

**JSON del Body:**
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
}],
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

## 5. Consultar Estado de Envío (HU4)

**Endpoint:** `GET /coordinadora/gestion-envios/envios/:guia`
**Propósito:** Permite rastrear el envío, devolviendo todos los detalles, incluyendo el historial de estados.

### 5.1. Consulta Exitosa

**Guía de ejemplo:** `23012600001` (Usar la guía generada en el paso 4.1)

**Respuesta esperada (200 OK):**
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
"fecha": "2026-01-23T14:30:00.000Z"
}
],
"fromCache": false,
"fechaCreacion": "2026-01-23T14:30:00.000Z",
"fechaActualizacion": "2026-01-23T14:30:00.000Z"
}
}
```

### 5.2. Error - Guía No Encontrada

**Guía de ejemplo:** `99999999999`

**Respuesta esperada (400 Bad Request):**
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

## 6. Actualizar Estado de Envío (HU4)

**Endpoint:** `PATCH /coordinadora/gestion-envios/envios/:guia/estado`
**Propósito:** Actualiza el estado del envío, registrando el cambio en el historial y validando la secuencia lógica de transición.

### 6.1. Cambiar a "En tránsito"

**Guía de ejemplo:** `23012600001` (Debe estar en estado "En espera")
**JSON del Body:**
```json
{
"estado": "En tránsito",
"ubicacion": "Centro de distribución Bogotá",
"observacion": "Paquete recibido en bodega"
}
```
**Respuesta esperada (200 OK):**
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
"fecha": "2026-01-23T14:30:00.000Z"
},
{
"estadoAnterior": "En espera",
"estadoNuevo": "En tránsito",
"ubicacion": "Centro de distribución Bogotá",
"observacion": "Paquete recibido en bodega",
"fecha": "2026-01-23T16:45:00.000Z"
}
],
"fechaActualizacion": "2026-01-23T16:45:00.000Z"
}
}
```

### 6.2. Cambiar a "Entregado"

**Guía de ejemplo:** `23012600001` (Debe estar en estado "En tránsito")
**JSON del Body:**
```json
{
"estado": "Entregado",
"ubicacion": "Carrera 15 #45-67, Chapinero, Bogotá",
"observacion": "Entregado a María García - Recibido conforme"
}
```

### 6.3. Error - Transición No Permitida

**Propósito:** Demuestra que el sistema valida la secuencia de estados. No se puede pasar de "En espera" directamente a "Entregado".
**JSON del Body:**
```json
{
"estado": "Entregado"
}
```
**Respuesta esperada (400 Bad Request):**
```json
{
"isError": true,
"message": "No se puede cambiar de \"En espera\" a \"Entregado\". La secuencia de estados no es válida.",
"code": "BAD_MESSAGE",
"statusCode": 400,
"cause": "Transición de estado no permitida"
}
```

---

## 7. Flujo Completo de Prueba (Secuencia de Pasos)

Esta secuencia de pasos describe el flujo de prueba completo para validar la funcionalidad de la aplicación.

1.  **Verificar salud:** Ejecutar `GET /health/ready` para asegurar que el servicio y sus dependencias están operativas.
2.  **Consultar tarifas:** Ejecutar `GET /coordinadora/gestion-envios/tarifas` para obtener las tarifas disponibles.
3.  **Cotizar envío:** Ejecutar `POST /coordinadora/gestion-envios/cotizar` con un paquete de prueba (ejemplo 3.1) y verificar el cálculo de peso facturable y el valor total.
4.  **Registrar el envío:** Ejecutar `POST /coordinadora/gestion-envios/envios` con un paquete completo (ejemplo 4.1). **Guardar el `numeroGuia`** de la respuesta.
5.  **Consultar el envío:** Ejecutar `GET /coordinadora/gestion-envios/envios/:guia` (usando la guía guardada) y verificar que el estado inicial es "En espera".
6.  **Actualizar a "En tránsito":** Ejecutar `PATCH /coordinadora/gestion-envios/envios/:guia/estado` (ejemplo 6.1) y verificar que el estado se actualiza correctamente.
7.  **Actualizar a "Entregado":** Ejecutar `PATCH /coordinadora/gestion-envios/envios/:guia/estado` (ejemplo 6.2) y verificar la transición final.
8.  **Verificar historial:** Ejecutar `GET /coordinadora/gestion-envios/envios/:guia` nuevamente para confirmar que el `historialEstados` contiene los tres estados en secuencia.

---

## 8. Rutas Disponibles para Cotización

Esta tabla muestra las rutas y tipos de producto que deben estar configurados en la base de datos para que la cotización funcione correctamente.

| Origen | Destino | Tipo Producto | Precio Base |
| :--- | :--- | :--- | :--- |
| MEDELLIN | BOGOTA | PAQUETE | $5,000/kg |
| MEDELLIN | BOGOTA | DOCUMENTO | $8,000/kg |
| BOGOTA | MEDELLIN | PAQUETE | $5,000/kg |
| BOGOTA | MEDELLIN | DOCUMENTO | $8,000/kg |
| BOGOTA | CALI | PAQUETE | $6,000/kg |
| BOGOTA | CALI | DOCUMENTO | $9,000/kg |
| CALI | BOGOTA | PAQUETE | $6,000/kg |
| CALI | BOGOTA | DOCUMENTO | $9,000/kg |
| MEDELLIN | CALI | PAQUETE | $5,500/kg |
| MEDELLIN | CALI | DOCUMENTO | $8,500/kg |
| BARRANQUILLA | BOGOTA | PAQUETE | $7,000/kg |
| BARRANQUILLA | BOGOTA | DOCUMENTO | $10,000/kg |
| BOGOTA | BARRANQUILLA | PAQUETE | $7,000/kg |
| BOGOTA | BARRANQUILLA | DOCUMENTO | $10,000/kg |
| CARTAGENA | BOGOTA | PAQUETE | $7,500/kg |
