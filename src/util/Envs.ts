import { validateEnvs } from './ValidateEnvs';

export const ENV = {
    DOMAIN: process.env.DOMAIN,
    GCP_PROJECT: process.env.GCP_PROJECT,
    HOST: process.env.HOST || 'localhost',
    NODE_ENV: process.env.NODE_ENV?.toLowerCase() || 'local',
    PORT: process.env.PORT ? parseInt(process.env.PORT) : 8080,
    PREFIX: `/${process.env.DOMAIN}/${process.env.SERVICE_NAME}`,
    SERVICE_NAME: process.env.SERVICE_NAME,

    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,

    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
    REDIS_TTL: process.env.REDIS_TTL ? parseInt(process.env.REDIS_TTL) : 300,
};

validateEnvs(ENV);

if (process.env.NODE_ENV !== 'test') {
    validateEnvs(ENV);}