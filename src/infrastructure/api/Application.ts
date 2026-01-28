import 'reflect-metadata';
import 'module-alias/register';
import dotenv from 'dotenv';
dotenv.config();

import fastify, { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { randomBytes } from 'node:crypto'; // Corrección SonarLint (S7772)
import { ENV } from '@util';
import { middlewares, errorHandler } from '@infrastructure/api/middlewares';
import { swagger_config, swagger_config_ui } from '@infrastructure/api/swagger';
import { EnvioRouter as initRoutes, HealthRouter } from '@infrastructure/api/routers';

// Creamos la instancia de Fastify
const app: FastifyInstance = fastify({
    genReqId: (_) => randomBytes(20).toString('hex'),
});

// Aplicamos middlewares globales y manejador de errores
middlewares(app);
errorHandler(app);

// Configuración de Swagger
app.register(fastifySwagger, swagger_config);
app.register(fastifySwaggerUi, swagger_config_ui);

// Registro de Rutas con prefijo dinámico
// Importante: initRoutes y HealthRouter son funciones asíncronas (Plugins)
app.register(initRoutes, { prefix: ENV.PREFIX });
app.register(HealthRouter, { prefix: ENV.PREFIX });

// Exportamos la instancia para ser usada en Server.ts y en los Tests
export { app as application };