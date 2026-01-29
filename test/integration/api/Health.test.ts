import 'reflect-metadata';
import { TYPES } from '../../../src/configuration/Types';
import { DEPENDENCY_CONTAINER } from '../../../src/configuration/DependecyContainer';
import { application } from '../../../src/infrastructure/api/Application';

import { CotizarEnvioAppService } from '../../../src/application/services/CotizarEnvioAppService';
import { RegistrarEnvioAppService } from '../../../src/application/services/RegistrarEnvioAppService';
import { ConsultarEnvioAppService } from '../../../src/application/services/ConsultarEnvioAppService';
import { ActualizarEstadoAppService } from '../../../src/application/services/ActualizarEstadoAppService';
import { ConsultarTarifasAppService } from '../../../src/application/services/ConsultarTarifasAppService';

describe('HealthRouter Coverage', () => {
    let db: any;

    beforeAll(async () => {
        jest.spyOn(console, 'info').mockImplementation(() => { });
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });

        const mockCache = {
            get: jest.fn(),
            set: jest.fn(),
            isConnected: jest.fn().mockReturnValue(true),
            disconnect: jest.fn()
        };

        const mockDb = {
            one: jest.fn().mockResolvedValue({ status: 'ok' }),
            connect: jest.fn(),
            $disconnect: jest.fn()
        };

        const mockRepo = {
            getTarifa: jest.fn(),
            save: jest.fn(),
            findByGuia: jest.fn(),
            getNextGuiaNumber: jest.fn(),
            getAllTarifas: jest.fn()
        };

        const infrastructure = [
            { type: TYPES.PostgresDatabase, value: mockDb },
            { type: TYPES.CacheService, value: mockCache },
            { type: TYPES.TarifaRepository, value: mockRepo },
            { type: TYPES.EnvioRepository, value: mockRepo }
        ];

        infrastructure.forEach(item => {
            if (DEPENDENCY_CONTAINER.isBound(item.type)) {
                DEPENDENCY_CONTAINER.unbind(item.type);
            }
            DEPENDENCY_CONTAINER.bind(item.type).toConstantValue(item.value);
        });

        const servicios = [
            { type: TYPES.CotizarEnvioAppService, class: CotizarEnvioAppService },
            { type: TYPES.RegistrarEnvioAppService, class: RegistrarEnvioAppService },
            { type: TYPES.ConsultarEnvioAppService, class: ConsultarEnvioAppService },
            { type: TYPES.ActualizarEstadoAppService, class: ActualizarEstadoAppService },
            { type: TYPES.ConsultarTarifasAppService, class: ConsultarTarifasAppService }
        ];

        servicios.forEach(s => {
            if (DEPENDENCY_CONTAINER.isBound(s.type)) {
                DEPENDENCY_CONTAINER.unbind(s.type);
            }
            DEPENDENCY_CONTAINER.bind(s.type).to(s.class);
        });

        await application.ready();
        db = DEPENDENCY_CONTAINER.get(TYPES.PostgresDatabase);
    });

    afterAll(async () => {
        await application.close();
        jest.restoreAllMocks();
    });

    it('GET /health/ready debería retornar 503 si la DB falla', async () => {
        jest.spyOn(db, 'one').mockRejectedValueOnce(new Error('DB Connection Failed'));

        const response = await application.inject({
            method: 'GET',
            url: '/health/ready'
        });

        expect(response.statusCode).toBe(503);
        const body = JSON.parse(response.body);
        expect(body.status).toBe('unhealthy');
    });

    it('GET /metrics debería retornar métricas de sistema', async () => {
        const response = await application.inject({
            method: 'GET',
            url: '/metrics'
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);

        expect(body).toHaveProperty('uptime');
        expect(body).toHaveProperty('memory');
        expect(body).toHaveProperty('cpu');
    });
});