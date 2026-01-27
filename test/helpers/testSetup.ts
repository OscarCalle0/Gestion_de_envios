import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') }); 

process.env.GCP_PROJECT = process.env.GCP_PROJECT || 'coordinadora-test-project';
process.env.REDIS_PASSWORD = process.env.REDIS_PASSWORD || 'test-redis-password';
process.env.DOMAIN = process.env.DOMAIN || 'coordinadora';
process.env.SERVICE_NAME = process.env.SERVICE_NAME || 'gestion-envios';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
process.env.DB_NAME = process.env.DB_NAME || 'coordinadora_db';

import 'reflect-metadata';

beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
    jest.restoreAllMocks();
});