import 'reflect-metadata';
import 'module-alias/register';
import dotenv from 'dotenv';
dotenv.config();
import fastify from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { randomBytes } from 'crypto';
import { ENV } from '@util';
import { middlewares, errorHandler } from '@infrastructure/api/middlewares';
import { swagger_config, swagger_config_ui } from '@infrastructure/api/swagger';
import { EnvioRouter as initRoutes, HealthRouter } from '@infrastructure/api/routers';

export const application = fastify({
    genReqId: (_) => randomBytes(20).toString('hex'),
});

middlewares(application);
errorHandler(application);

application.register(fastifySwagger, swagger_config);
application.register(fastifySwaggerUi, swagger_config_ui);

application.register(initRoutes, { prefix: ENV.PREFIX });

application.register(HealthRouter, { prefix: ENV.PREFIX });
