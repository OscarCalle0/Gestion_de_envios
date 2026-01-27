export const cotizarSchema = {
    summary: 'Cotizar un envío',
    description:
        'Calcula el valor de un envío basándose en las dimensiones, peso y ruta. El peso facturable es el mayor entre el peso real y el peso volumétrico (alto*ancho*largo/2500).',
    tags: ['Cotización'],
    body: {
        type: 'object',
        required: ['tipoProducto', 'origen', 'destino', 'unidades'],
        properties: {
            tipoProducto: {
                type: 'string',
                enum: ['PAQUETE', 'DOCUMENTO'],
                description: 'Tipo de producto a enviar',
            },
            origen: {
                type: 'string',
                description: 'Ciudad de origen del envío (ej: MEDELLIN)',
            },
            destino: {
                type: 'string',
                description: 'Ciudad de destino del envío (ej: BOGOTA)',
            },
            unidades: {
                type: 'array',
                description: 'Lista de paquetes/unidades a enviar',
                items: {
                    type: 'object',
                    required: ['pesoReal', 'alto', 'ancho', 'largo'],
                    properties: {
                        pesoReal: { type: 'number', description: 'Peso real en kilogramos (ej: 5)' },
                        alto: { type: 'number', description: 'Alto en centímetros (ej: 30)' },
                        ancho: { type: 'number', description: 'Ancho en centímetros (ej: 20)' },
                        largo: { type: 'number', description: 'Largo en centímetros (ej: 40)' },
                    },
                },
            },
        },
    },
    response: {
        200: {
            description: 'Cotización calculada exitosamente',
            type: 'object',
            properties: {
                isError: { type: 'boolean' },
                data: {
                    type: 'object',
                    properties: {
                        tipoProducto: { type: 'string' },
                        ruta: { type: 'string' },
                        unidades: { type: 'array' },
                        valorTotalCotizacion: { type: 'number' },
                        moneda: { type: 'string' },
                    },
                },
                timestamp: { type: 'string' },
            },
        },
        400: {
            description: 'Error de validación o ruta no encontrada',
        },
    },
};

export const registrarSchema = {
    summary: 'Registrar un nuevo envío',
    description:
        'Crea un nuevo envío en el sistema con estado inicial "En espera". Genera automáticamente un número de guía único.',
    tags: ['Envíos'],
    body: {
        type: 'object',
        required: [
            'tipoProducto',
            'origen',
            'destino',
            'valorDeclarado',
            'metodoPago',
            'unidades',
            'remitente',
            'destinatario',
        ],
        properties: {
            tipoProducto: {
                type: 'string',
                enum: ['PAQUETE', 'DOCUMENTO'],
                description: 'Tipo de producto a enviar',
            },
            origen: {
                type: 'string',
                description: 'Ciudad de origen (ej: MEDELLIN)',
            },
            destino: {
                type: 'string',
                description: 'Ciudad de destino (ej: BOGOTA)',
            },
            valorDeclarado: {
                type: 'number',
                description: 'Valor declarado del contenido en COP (ej: 500000)',
            },
            metodoPago: {
                type: 'string',
                enum: ['FLETE_PAGO', 'CONTRA_ENTREGA', 'RECAUDO'],
                description: 'Método de pago del envío',
            },
            valorCotizacion: {
                type: 'number',
                description: 'Valor de cotización previamente calculado - opcional (ej: 25000)',
            },
            unidades: {
                type: 'array',
                description: 'Lista de paquetes/unidades',
                items: {
                    type: 'object',
                    properties: {
                        pesoReal: { type: 'number', description: 'Peso en kg (ej: 5)' },
                        alto: { type: 'number', description: 'Alto en cm (ej: 30)' },
                        ancho: { type: 'number', description: 'Ancho en cm (ej: 20)' },
                        largo: { type: 'number', description: 'Largo en cm (ej: 40)' },
                    },
                },
            },
            remitente: {
                type: 'object',
                required: ['nombre', 'direccion', 'telefono'],
                properties: {
                    nombre: { type: 'string', description: 'Nombre del remitente' },
                    direccion: { type: 'string', description: 'Dirección del remitente' },
                    telefono: { type: 'string', description: 'Teléfono del remitente' },
                },
            },
            destinatario: {
                type: 'object',
                required: ['nombre', 'direccion', 'telefono'],
                properties: {
                    nombre: { type: 'string', description: 'Nombre del destinatario' },
                    direccion: { type: 'string', description: 'Dirección del destinatario' },
                    telefono: { type: 'string', description: 'Teléfono del destinatario' },
                    infoAdicional: { type: 'string', description: 'Información adicional - opcional' },
                },
            },
        },
    },
    response: {
        201: {
            description: 'Envío registrado exitosamente',
            type: 'object',
            additionalProperties: true,
            properties: {
                isError: { type: 'boolean' },
                data: {
                    type: 'object',
                    additionalProperties: true,
                    properties: {
                        mensaje: { type: 'string' },
                        id: { type: 'string' },
                        numeroGuia: { type: 'string' },
                        estado: { type: 'string' },
                        ruta: { type: 'string' },
                        tipoProducto: { type: 'string' },
                        valorTotal: { type: 'number' },
                        moneda: { type: 'string' },
                        unidades: { type: 'array' },
                    },
                },
                timestamp: { type: 'string' },
            },
        },
        400: {
            description: 'Error de validación',
        },
    },
};

export const consultarEnvioSchema = {
    summary: 'Consultar estado de un envío',
    description: 'Obtiene el estado actual y el historial de un envío por su número de guía.',
    tags: ['Seguimiento'],
    params: {
        type: 'object',
        properties: {
            guia: {
                type: 'string',
                description: 'Número de guía del envío (ej: 23012600001)',
            },
        },
    },
    response: {
        200: {
            description: 'Información del envío',
            type: 'object',
            additionalProperties: true,
        },
        400: {
            description: 'Guía no encontrada',
        },
    },
};

export const actualizarEstadoSchema = {
    summary: 'Actualizar estado de un envío',
    description: 'Actualiza el estado de un envío siguiendo la secuencia: En espera → En tránsito → Entregado',
    tags: ['Seguimiento'],
    params: {
        type: 'object',
        properties: {
            guia: {
                type: 'string',
                description: 'Número de guía del envío',
            },
        },
    },
    body: {
        type: 'object',
        required: ['estado'],
        properties: {
            estado: {
                type: 'string',
                enum: ['En espera', 'En tránsito', 'Entregado'],
                description: 'Nuevo estado del envío',
            },
            ubicacion: {
                type: 'string',
                description: 'Ubicación actual del paquete - opcional (ej: Centro de distribución Bogotá)',
            },
            observacion: {
                type: 'string',
                description: 'Observación adicional - opcional (ej: Paquete en buen estado)',
            },
        },
    },
    response: {
        200: {
            description: 'Estado actualizado exitosamente',
            type: 'object',
            additionalProperties: true,
        },
        400: {
            description: 'Error de validación o transición no permitida',
        },
    },
};

export const consultarTarifasSchema = {
    summary: 'Consultar tabla de tarifas',
    description: 'Obtiene todas las tarifas disponibles para cotización de envíos.',
    tags: ['Tarifas'],
    response: {
        200: {
            description: 'Lista de tarifas',
            type: 'object',
            additionalProperties: true,
            properties: {
                isError: { type: 'boolean' },
                data: {
                    type: 'object',
                    additionalProperties: true,
                    properties: {
                        totalTarifas: { type: 'number' },
                        moneda: { type: 'string' },
                        descripcion: { type: 'string' },
                        tarifas: { type: 'array' },
                        tarifasDetalle: { type: 'array' },
                    },
                },
                timestamp: { type: 'string' },
            },
        },
    },
};
