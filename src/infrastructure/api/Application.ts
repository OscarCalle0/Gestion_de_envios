import 'reflect-metadata';
import 'module-alias/register';
import dotenv from 'dotenv';
dotenv.config();

import fastify, { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { randomBytes } from 'node:crypto';
import { ENV } from '@util';
import { middlewares, errorHandler } from '@infrastructure/api/middlewares';
import { swagger_config, swagger_config_ui } from '@infrastructure/api/swagger';
import { EnvioRouter as initRoutes, HealthRouter } from '@infrastructure/api/routers';

const app: FastifyInstance = fastify({
    genReqId: (_) => randomBytes(20).toString('hex'),
});

middlewares(app);
errorHandler(app);

app.register(fastifySwagger, swagger_config);
app.register(fastifySwaggerUi, swagger_config_ui);

app.register(initRoutes, { prefix: ENV.PREFIX });
app.register(HealthRouter, { prefix: '' });

export { app as application };