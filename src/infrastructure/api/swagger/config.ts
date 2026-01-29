import { ENV } from '@util';
import { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

export const swagger_config: FastifyDynamicSwaggerOptions = {
    openapi: {
        info: {
            title: 'API Gestión de Envíos y Rutas Logísticas',
            description: `
## Microservicio de Coordinadora

Este microservicio implementa la gestión completa de envíos y rutas logísticas, incluyendo:

- **Cotización de envíos**: Calcula el valor de un envío basándose en peso, dimensiones y ruta
- **Registro de envíos**: Crea nuevos envíos con generación automática de guías
- **Seguimiento de envíos**: Consulta y actualización de estados en tiempo real
- **Consulta de tarifas**: Acceso a la tabla de tarifas por ruta y tipo de producto

### Reglas de Negocio

- **Peso Volumétrico**: alto × ancho × largo / 2500 (redondeado hacia arriba)
- **Peso Facturable**: El mayor entre peso real y peso volumétrico
- **Estados de Envío**: En espera → En tránsito → Entregado
- **Formato de Guía**: DDMMYY + consecutivo de 5 dígitos

### Historias de Usuario Implementadas

1. **HU1**: Cotización de una orden de envío
2. **HU2**: Creación de orden de envío
3. **HU4**: Seguimiento del estado del envío
            `,
            version: '1.0.0',
            contact: {
                name: 'Coordinadora Mercantil S.A',
                url: 'https://www.coordinadora.com/',
                email: 'it@coordinadora.com',
            },
        },
        servers: [
            {
                url: `http://127.0.0.1:${ENV.PORT}`,
                description: 'Servidor Local',
            }
        ],
        tags: [
            { name: 'Cotización', description: 'Endpoints para cotizar envíos' },
            { name: 'Envíos', description: 'Endpoints para gestionar envíos' },
            { name: 'Seguimiento', description: 'Endpoints para seguimiento de envíos' },
            { name: 'Tarifas', description: 'Endpoints para consultar tarifas' },
        ],
    },
};

export const swagger_config_ui: FastifySwaggerUiOptions = {
    routePrefix: '/docs',
    uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
    },
    staticCSP: true,
};
