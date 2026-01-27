import 'reflect-metadata';
import { application } from '@infrastructure/api/Application';
import { DEPENDENCY_CONTAINER, TYPES } from '@configuration';

import { CotizarEnvioAppService } from '@application/services/CotizarEnvioAppService';
import { RegistrarEnvioAppService } from '@application/services/RegistrarEnvioAppService';
import { ConsultarEnvioAppService } from '@application/services/ConsultarEnvioAppService';
import { ActualizarEstadoAppService } from '@application/services/ActualizarEstadoAppService';
import { ConsultarTarifasAppService } from '@application/services/ConsultarTarifasAppService';

describe('HealthRouter Coverage', () => {
    let db: any;

    beforeAll(async () => {
        jest.spyOn(console, 'info').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});


        const mockCache = { 
            get: jest.fn(), 
            set: jest.fn(), 
            isConnected: jest.fn().mockReturnValue(true)
        };


        const mockDb = { 
            one: jest.fn().mockResolvedValue({ status: 'ok' }),
            connect: jest.fn() 
        };


        const mockRepo = { 
            getTarifa: jest.fn(), 
            save: jest.fn(), 
            findByGuia: jest.fn(),
            getNextGuiaNumber: jest.fn()
        };


        const infrastructure = [
            { type: TYPES.PostgresDatabase, value: mockDb },
            { type: TYPES.CacheService, value: mockCache },
            { type: TYPES.TarifaRepository, value: mockRepo },
            { type: TYPES.EnvioRepository, value: mockRepo }
        ];

        infrastructure.forEach(item => {
            if (!DEPENDENCY_CONTAINER.isBound(item.type)) {
                DEPENDENCY_CONTAINER.bind(item.type).toConstantValue(item.value);
            }
        });


        const servicios = [
            { type: TYPES.CotizarEnvioAppService, class: CotizarEnvioAppService },
            { type: TYPES.RegistrarEnvioAppService, class: RegistrarEnvioAppService },
            { type: TYPES.ConsultarEnvioAppService, class: ConsultarEnvioAppService },
            { type: TYPES.ActualizarEstadoAppService, class: ActualizarEstadoAppService },
            { type: TYPES.ConsultarTarifasAppService, class: ConsultarTarifasAppService }
        ];

        servicios.forEach(s => {
            if (!DEPENDENCY_CONTAINER.isBound(s.type)) {
                DEPENDENCY_CONTAINER.bind(s.type).to(s.class);
            }
        });

        await application.ready();
        db = DEPENDENCY_CONTAINER.get(TYPES.PostgresDatabase);
    });

    afterAll(async () => {
        await application.close();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('GET /health/ready debería retornar 503 si la DB falla', async () => {
        jest.spyOn(db, 'one').mockRejectedValueOnce(new Error('DB Connection Failed'));

        const response = await application.inject({
            method: 'GET',
            url: '/coordinadora/gestion-envios/health/ready'
        });


        expect(response.statusCode).toBe(503);
        const body = JSON.parse(response.body);
        expect(body.status).toBe('unhealthy');
    });

    it('GET /metrics debería retornar métricas de sistema', async () => {
        const response = await application.inject({
            method: 'GET',
            url: '/coordinadora/gestion-envios/metrics'
        });
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body).toHaveProperty('uptime');
    });
});