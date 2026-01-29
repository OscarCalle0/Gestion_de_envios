import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import formbody from '@fastify/formbody';
import { validatePubSub } from '@infrastructure/api';
import { decode, parse } from '@util';

type Payload = Record<string, unknown>;

export const middlewares = (application: FastifyInstance): void => {
    application.register(cors, {
        origin: true,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    });
    application.register(formbody);
    
    application.register(helmet, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: [`'self'`],
                styleSrc: [`'self'`, `'unsafe-inline'`],
                imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
                scriptSrc: [`'self'`,`'unsafe-inline'`, `https:`],
                connectSrc: [`'self'`, `*`],
            },
        },
    });
    application.addHook<Payload, any>('onSend', async (req, reply, payload) => {
        const { method, url, body } = req;
        const isPubSub = validatePubSub(body);
        console.log(
            JSON.stringify({
                application: process.env.SERVICE_NAME ?? 'SERVICE_NAME NOT FOUND',
                method,
                url,
                request: {
                    body: body ?? null,
                    buffer: isPubSub ? parse(decode(isPubSub.message.data)) : undefined,
                    messageId: isPubSub ? isPubSub.message.messageId : undefined,
                },
                response: {
                    statusCode: reply.statusCode,
                    payload,
                },
            }),
        );
    });
};
