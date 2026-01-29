import 'reflect-metadata';
import 'module-alias/register';
import dotenv from 'dotenv';
dotenv.config();

import { TYPES } from '../../../src/configuration/Types';

import { DEPENDENCY_CONTAINER } from '../../../src/configuration/DependecyContainer';

import { CotizarEnvioAppService } from '../../../src/application/services/CotizarEnvioAppService';
import { RegistrarEnvioAppService } from '../../../src/application/services/RegistrarEnvioAppService';
import { ConsultarEnvioAppService } from '../../../src/application/services/ConsultarEnvioAppService';
import { ActualizarEstadoAppService } from '../../../src/application/services/ActualizarEstadoAppService';
import { ConsultarTarifasAppService } from '../../../src/application/services/ConsultarTarifasAppService';

import { application } from '../../../src/infrastructure/api/Application';

import { envioValidoFixture, cotizacionValidaFixture } from '../../fixtures/envioFixtures';

describe('API Integration Tests - Lifecycle Consistency', () => {
    
    const forceBind = (type: symbol, value: any, isConstant = true) => {
        if (DEPENDENCY_CONTAINER.isBound(type)) {
            DEPENDENCY_CONTAINER.unbind(type);
        }
        if (isConstant) {
            DEPENDENCY_CONTAINER.bind(type).toConstantValue(value);
        } else {
            DEPENDENCY_CONTAINER.bind(type).to(value).inSingletonScope();
        }
    };

    beforeAll(async () => {
        const mockDb = { 
            connect: jest.fn(), 
            query: jest.fn().mockResolvedValue({ rows: [] }),
            disconnect: jest.fn(),
            tx: jest.fn((fn) => fn({ none: jest.fn(), one: jest.fn(), manyOrNone: jest.fn(), oneOrNone: jest.fn() }))
        };

        const mockCache = { 
            get: jest.fn(), 
            set: jest.fn(), 
            del: jest.fn(),
            connect: jest.fn(),
            disconnect: jest.fn(),
            isConnected: jest.fn().mockReturnValue(true)
        };

        const mockRepo = { 
            getTarifa: jest.fn(), 
            save: jest.fn(), 
            findByGuia: jest.fn(), 
            updateEstado: jest.fn(),
            getHistorial: jest.fn(),
            getNextGuiaNumber: jest.fn(),
            getAllTarifas: jest.fn()
        };

        forceBind(TYPES.PostgresDatabase, mockDb);
        forceBind(TYPES.CacheService, mockCache);
        forceBind(TYPES.TarifaRepository, mockRepo);
        forceBind(TYPES.EnvioRepository, mockRepo);

        const servicios = [
            { type: TYPES.CotizarEnvioAppService, class: CotizarEnvioAppService },
            { type: TYPES.RegistrarEnvioAppService, class: RegistrarEnvioAppService },
            { type: TYPES.ConsultarEnvioAppService, class: ConsultarEnvioAppService },
            { type: TYPES.ActualizarEstadoAppService, class: ActualizarEstadoAppService },
            { type: TYPES.ConsultarTarifasAppService, class: ConsultarTarifasAppService }
        ];

        servicios.forEach(s => forceBind(s.type, s.class, false));

        await application.ready();
    });

    afterAll(async () => {
        await application.close();
    });

    it('debería completar el ciclo de vida manteniendo la consistencia entre DB y Redis', async () => {
        const repo = DEPENDENCY_CONTAINER.get<any>(TYPES.EnvioRepository);
        const tarifaRepo = DEPENDENCY_CONTAINER.get<any>(TYPES.TarifaRepository);
        
        tarifaRepo.getTarifa.mockResolvedValue({ precioBase: 5000, factorVolumetrico: 2500 });
        repo.getNextGuiaNumber.mockResolvedValue('23012600001'); 
        repo.save.mockResolvedValue({ numeroGuia: '23012600001', id: 'uuid-test' });
        repo.findByGuia.mockResolvedValue({ 
            id: 'uuid-test', 
            numeroGuia: '23012600001', 
            estado: 'En espera' 
        });

        const cotizarRes = await application.inject({
            method: 'POST',
            url: '/coordinadora/gestion-envios/cotizar',
            payload: cotizacionValidaFixture,
        });
        expect(cotizarRes.statusCode).toBe(200);

        const registroRes = await application.inject({
            method: 'POST',
            url: '/coordinadora/gestion-envios/envios',
            payload: envioValidoFixture,
        });
        
        expect(registroRes.statusCode).toBe(201);
        const registroBody = JSON.parse(registroRes.body);
        expect(registroBody.data.numeroGuia).toBe('23012600001');
        expect(repo.save).toHaveBeenCalled();
    });
});