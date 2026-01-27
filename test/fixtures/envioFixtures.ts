export const envioValidoFixture = {
    tipoProducto: 'PAQUETE' as const,
    origen: 'MEDELLIN',
    destino: 'BOGOTA',
    valorDeclarado: 500000,
    metodoPago: 'FLETE_PAGO' as const,
    unidades: [{ pesoReal: 5, alto: 30, ancho: 20, largo: 40 }],
    remitente: {
        nombre: 'Juan Pérez',
        direccion: 'Calle 10 #20-30',
        telefono: '3001234567',
    },
    destinatario: {
        nombre: 'María García',
        direccion: 'Carrera 15 #45-67',
        telefono: '3109876543',
    },
};

export const cotizacionValidaFixture = {
    tipoProducto: 'PAQUETE' as const,
    origen: 'MEDELLIN',
    destino: 'BOGOTA',
    unidades: [{ pesoReal: 5, alto: 30, ancho: 20, largo: 40 }],
};

export const actualizarEstadoTransitoFixture = {
    estado: 'En tránsito' as const,
    ubicacion: 'Centro de distribución Bogotá',
    observacion: 'Paquete recibido',
};

export const actualizarEstadoEntregadoFixture = {
    estado: 'Entregado' as const,
    ubicacion: 'Dirección del destinatario',
    observacion: 'Entregado a persona autorizada',
};
