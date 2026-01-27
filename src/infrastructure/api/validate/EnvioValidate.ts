import Joi from 'joi';

const mensajesValidacion = {
    'string.base': 'El campo {#label} debe ser un texto',
    'string.empty': 'El campo {#label} no puede estar vacío',
    'number.base': 'El campo {#label} debe ser un número',
    'number.positive': 'El campo {#label} debe ser un número positivo',
    'any.required': 'El campo {#label} es obligatorio',
    'any.only': 'El campo {#label} debe ser uno de los valores permitidos: {#valids}',
    'array.min': 'El campo {#label} debe tener al menos {#limit} elemento(s)',
    'object.base': 'El campo {#label} debe ser un objeto válido',
};

export const CotizarValidate = Joi.object({
    tipoProducto: Joi.string().valid('PAQUETE', 'DOCUMENTO').required().label('tipoProducto').messages({
        'any.only': 'El tipo de producto debe ser PAQUETE o DOCUMENTO',
    }),
    origen: Joi.string().min(2).max(100).required().label('origen').messages({
        'string.min': 'El origen debe tener al menos 2 caracteres',
    }),
    destino: Joi.string().min(2).max(100).required().label('destino').messages({
        'string.min': 'El destino debe tener al menos 2 caracteres',
    }),
    unidades: Joi.array()
        .items(
            Joi.object({
                pesoReal: Joi.number().positive().required().label('pesoReal').messages({
                    'number.positive': 'El peso real debe ser mayor a 0',
                }),
                alto: Joi.number().positive().required().label('alto').messages({
                    'number.positive': 'El alto debe ser mayor a 0',
                }),
                ancho: Joi.number().positive().required().label('ancho').messages({
                    'number.positive': 'El ancho debe ser mayor a 0',
                }),
                largo: Joi.number().positive().required().label('largo').messages({
                    'number.positive': 'El largo debe ser mayor a 0',
                }),
            }).required(),
        )
        .min(1)
        .required()
        .label('unidades')
        .messages({
            'array.min': 'Debe incluir al menos una unidad para cotizar',
        }),
}).messages(mensajesValidacion);

export const RegistrarValidate = Joi.object({
    tipoProducto: Joi.string().valid('PAQUETE', 'DOCUMENTO').required().label('tipoProducto').messages({
        'any.only': 'El tipo de producto debe ser PAQUETE o DOCUMENTO',
    }),
    origen: Joi.string().min(2).max(100).required().label('origen'),
    destino: Joi.string().min(2).max(100).required().label('destino'),
    valorDeclarado: Joi.number().positive().required().label('valorDeclarado').messages({
        'number.positive': 'El valor declarado debe ser mayor a 0',
    }),
    metodoPago: Joi.string().valid('FLETE_PAGO', 'CONTRA_ENTREGA', 'RECAUDO').required().label('metodoPago').messages({
        'any.only': 'El método de pago debe ser FLETE_PAGO, CONTRA_ENTREGA o RECAUDO',
    }),
    valorCotizacion: Joi.number().positive().optional().label('valorCotizacion').messages({
        'number.positive': 'El valor de cotización debe ser mayor a 0',
    }),
    unidades: Joi.array()
        .items(
            Joi.object({
                pesoReal: Joi.number().positive().required().label('pesoReal'),
                alto: Joi.number().positive().required().label('alto'),
                ancho: Joi.number().positive().required().label('ancho'),
                largo: Joi.number().positive().required().label('largo'),
            }).required(),
        )
        .min(1)
        .required()
        .label('unidades')
        .messages({
            'array.min': 'Debe incluir al menos una unidad',
        }),
    remitente: Joi.object({
        nombre: Joi.string().min(2).max(200).required().label('nombre'),
        direccion: Joi.string().min(5).required().label('direccion'),
        telefono: Joi.string().min(7).max(20).required().label('telefono'),
    })
        .required()
        .label('remitente'),
    destinatario: Joi.object({
        nombre: Joi.string().min(2).max(200).required().label('nombre'),
        direccion: Joi.string().min(5).required().label('direccion'),
        telefono: Joi.string().min(7).max(20).required().label('telefono'),
        infoAdicional: Joi.string().max(500).optional().label('infoAdicional'),
    })
        .required()
        .label('destinatario'),
}).messages(mensajesValidacion);

export const ConsultarGuiaValidate = Joi.object({
    guia: Joi.string().min(5).max(20).required().label('guia').messages({
        'string.min': 'El número de guía debe tener al menos 5 caracteres',
        'string.max': 'El número de guía no puede exceder 20 caracteres',
        'any.required': 'El número de guía es obligatorio',
    }),
}).messages(mensajesValidacion);

export const ActualizarEstadoValidate = Joi.object({
    estado: Joi.string().valid('En espera', 'En tránsito', 'Entregado').required().label('estado').messages({
        'any.only': 'El estado debe ser: "En espera", "En tránsito" o "Entregado"',
        'any.required': 'El estado es obligatorio',
    }),
    ubicacion: Joi.string().max(200).optional().label('ubicacion').messages({
        'string.max': 'La ubicación no puede exceder 200 caracteres',
    }),
    observacion: Joi.string().max(500).optional().label('observacion').messages({
        'string.max': 'La observación no puede exceder 500 caracteres',
    }),
}).messages(mensajesValidacion);
