CREATE TABLE IF NOT EXISTS tarifas (
    id SERIAL PRIMARY KEY,
    origen VARCHAR(100) NOT NULL,
    destino VARCHAR(100) NOT NULL,
    tipo_producto VARCHAR(20) NOT NULL,
    precio_base NUMERIC(12, 2) NOT NULL,
    factor_volumetrico INTEGER DEFAULT 2500,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(origen, destino, tipo_producto)
);


CREATE TABLE IF NOT EXISTS envios (
    id VARCHAR(50) PRIMARY KEY,
    numero_guia VARCHAR(20) UNIQUE NOT NULL,
    tipo_producto VARCHAR(20) NOT NULL,
    origen VARCHAR(100) NOT NULL,
    destino VARCHAR(100) NOT NULL,
    valor_declarado NUMERIC(12, 2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'COP',
    metodo_pago VARCHAR(30) NOT NULL, 
    valor_total_cotizacion NUMERIC(12, 2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'En espera',
 
    remitente_nombre VARCHAR(200) NOT NULL,
    remitente_direccion TEXT NOT NULL,
    remitente_telefono VARCHAR(20) NOT NULL,

    destinatario_nombre VARCHAR(200) NOT NULL,
    destinatario_direccion TEXT NOT NULL,
    destinatario_telefono VARCHAR(20) NOT NULL,
    destinatario_info_adicional TEXT,
    
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS envio_unidades (
    id SERIAL PRIMARY KEY,
    envio_id VARCHAR(50) REFERENCES envios(id) ON DELETE CASCADE,
    peso_real NUMERIC(10, 2) NOT NULL,
    alto NUMERIC(10, 2) NOT NULL,
    ancho NUMERIC(10, 2) NOT NULL,
    largo NUMERIC(10, 2) NOT NULL,
    peso_volumetrico NUMERIC(10, 2) NOT NULL,
    peso_facturable NUMERIC(10, 2) NOT NULL
);


CREATE TABLE IF NOT EXISTS envio_historial (
    id SERIAL PRIMARY KEY,
    envio_id VARCHAR(50) REFERENCES envios(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    ubicacion VARCHAR(200),
    observacion TEXT,
    fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS guia_secuencia (
    fecha_clave VARCHAR(6) PRIMARY KEY, 
    ultimo_consecutivo INTEGER DEFAULT 0
);


CREATE INDEX IF NOT EXISTS idx_envios_guia ON envios(numero_guia);
CREATE INDEX IF NOT EXISTS idx_envios_estado ON envios(estado);
CREATE INDEX IF NOT EXISTS idx_historial_envio ON envio_historial(envio_id);
CREATE INDEX IF NOT EXISTS idx_tarifas_ruta ON tarifas(origen, destino);


INSERT INTO tarifas (origen, destino, tipo_producto, precio_base, factor_volumetrico) VALUES 
('MEDELLIN', 'BOGOTA', 'PAQUETE', 5000.00, 2500),
('MEDELLIN', 'BOGOTA', 'DOCUMENTO', 8000.00, 2500),
('BOGOTA', 'CALI', 'PAQUETE', 6000.00, 2500),
('BOGOTA', 'CALI', 'DOCUMENTO', 9000.00, 2500),
('BOGOTA', 'MEDELLIN', 'PAQUETE', 5000.00, 2500),
('BOGOTA', 'MEDELLIN', 'DOCUMENTO', 8000.00, 2500),
('CALI', 'BOGOTA', 'PAQUETE', 6000.00, 2500),
('CALI', 'MEDELLIN', 'PAQUETE', 7000.00, 2500),
('BARRANQUILLA', 'BOGOTA', 'PAQUETE', 8000.00, 2500),
('BARRANQUILLA', 'BOGOTA', 'DOCUMENTO', 10000.00, 2500),
('BOGOTA', 'BARRANQUILLA', 'PAQUETE', 8000.00, 2500),
('CARTAGENA', 'BOGOTA', 'PAQUETE', 9000.00, 2500),
('BOGOTA', 'CARTAGENA', 'PAQUETE', 9000.00, 2500),
('MEDELLIN', 'CALI', 'AMBOS', 5500.00, 2500),
('CALI', 'CARTAGENA', 'AMBOS', 10000.00, 2500)
ON CONFLICT DO NOTHING;
