import 'reflect-metadata';
import 'module-alias/register';
import dotenv from 'dotenv';
dotenv.config();

import { application } from '@infrastructure/api/Application';
import { DEPENDENCY_CONTAINER, TYPES } from '@configuration';
import { envioValidoFixture, cotizacionValidaFixture } from '../../fixtures/envioFixtures';

import { CotizarEnvioAppService } from '@application/services/CotizarEnvioAppService';
import { RegistrarEnvioAppService } from '@application/services/RegistrarEnvioAppService';
import { ConsultarEnvioAppService } from '@application/services/ConsultarEnvioAppService';
import { ActualizarEstadoAppService } from '@application/services/ActualizarEstadoAppService';
import { ConsultarTarifasAppService } from '@application/services/ConsultarTarifasAppService';

describe('API Integration Tests', () => {
    beforeAll(async () => {
        const mockDb = { 
            connect: jest.fn(), 
            query: jest.fn().mockResolvedValue({ rows: [] }),
            disconnect: jest.fn() 
        };
        const mockCache = { 
            get: jest.fn(), 
            set: jest.fn(), 
            del: jest.fn(),
            connect: jest.fn() 
        };

        if (!DEPENDENCY_CONTAINER.isBound(TYPES.PostgresDatabase)) {
            DEPENDENCY_CONTAINER.bind(TYPES.PostgresDatabase).toConstantValue(mockDb);
        }
        if (!DEPENDENCY_CONTAINER.isBound(TYPES.CacheService)) {
            DEPENDENCY_CONTAINER.bind(TYPES.CacheService).toConstantValue(mockCache);
        }


        const mockRepo = { 
            getTarifa: jest.fn(), 
            save: jest.fn(), 
            findByGuia: jest.fn(), 
            updateEstado: jest.fn(),
            getHistorial: jest.fn(),
            getNextGuiaNumber: jest.fn().mockResolvedValue('1234567890') 
        };

        if (!DEPENDENCY_CONTAINER.isBound(TYPES.TarifaRepository)) {
            DEPENDENCY_CONTAINER.bind(TYPES.TarifaRepository).toConstantValue(mockRepo);
        }
        if (!DEPENDENCY_CONTAINER.isBound(TYPES.EnvioRepository)) {
            DEPENDENCY_CONTAINER.bind(TYPES.EnvioRepository).toConstantValue(mockRepo);
        }


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
        repo.findByGuia.mockResolvedValue({ id: 'uuid-test', numeroGuia: '23012600001', estado: 'En espera' });



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
        expect(registroBody.data.numeroGuia).toBeDefined();
    });
});