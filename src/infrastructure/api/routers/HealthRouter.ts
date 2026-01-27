import { FastifyInstance } from 'fastify';
import { DEPENDENCY_CONTAINER, TYPES } from '@configuration';
import { CacheService } from '@infrastructure/cache/RedisCache';
import { IDatabase } from 'pg-promise';

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    uptime: number;
    version: string;
    services: {
        database: {
            status: 'up' | 'down';
            responseTime?: number;
        };
        redis: {
            status: 'up' | 'down';
            connected: boolean;
        };
    };
}

export const HealthRouter = async (fastify: FastifyInstance): Promise<void> => {
    const db = DEPENDENCY_CONTAINER.get<IDatabase<unknown>>(TYPES.PostgresDatabase);
    const cacheService = DEPENDENCY_CONTAINER.get<CacheService>(TYPES.CacheService);

    fastify.get(
        '/health',
        {
            schema: {
                description: 'Health check básico del servicio',
                tags: ['Monitoreo'],
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            status: { type: 'string' },
                            timestamp: { type: 'string' },
                        },
                    },
                },
            },
        },
        async (_request, reply) => {
            return reply.status(200).send({
                status: 'ok',
                timestamp: new Date().toISOString(),
            });
        },
    );

    fastify.get(
        '/health/ready',
        {
            schema: {
                description: 'Health check detallado con estado de dependencias',
                tags: ['Monitoreo'],
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            status: { type: 'string' },
                            timestamp: { type: 'string' },
                            uptime: { type: 'number' },
                            version: { type: 'string' },
                            services: {
                                type: 'object',
                                properties: {
                                    database: {
                                        type: 'object',
                                        properties: {
                                            status: { type: 'string' },
                                            responseTime: { type: 'number' },
                                        },
                                    },
                                    redis: {
                                        type: 'object',
                                        properties: {
                                            status: { type: 'string' },
                                            connected: { type: 'boolean' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        async (_request, reply) => {
            const healthStatus: HealthStatus = {
                status: 'healthy',
                timestamp: new Date(),
                uptime: process.uptime(),
                version: '1.0.0',
                services: {
                    database: { status: 'down' },
                    redis: { status: 'down', connected: false },
                },
            };

            try {
                const startTime = Date.now();
                await db.one('SELECT 1 as check');
                healthStatus.services.database = {
                    status: 'up',
                    responseTime: Date.now() - startTime,
                };
            } catch {
                healthStatus.services.database = { status: 'down' };
                healthStatus.status = 'degraded';
            }

            const redisConnected = cacheService.isConnected();
            healthStatus.services.redis = {
                status: redisConnected ? 'up' : 'down',
                connected: redisConnected,
            };

            if (!redisConnected && healthStatus.status === 'healthy') {
                healthStatus.status = 'degraded';
            }

            if (healthStatus.services.database.status === 'down') {
                healthStatus.status = 'unhealthy';
                return reply.status(503).send(healthStatus);
            }

            return reply.status(200).send(healthStatus);
        },
    );

    fastify.get(
        '/metrics',
        {
            schema: {
                description: 'Métricas básicas del servicio',
                tags: ['Monitoreo'],
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            uptime: { type: 'number' },
                            memory: { type: 'object' },
                            cpu: { type: 'object' },
                        },
                    },
                },
            },
        },
        async (_request, reply) => {
            const memoryUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();

            return reply.status(200).send({
                uptime: process.uptime(),
                memory: {
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
                    external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB',
                    rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
                },
                cpu: {
                    user: cpuUsage.user,
                    system: cpuUsage.system,
                },
                timestamp: new Date().toISOString(),
            });
        },
    );
};
