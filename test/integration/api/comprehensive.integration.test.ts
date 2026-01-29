import 'module-alias/register';
import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { TYPES } from '../../../src/configuration/Types';
import { DEPENDENCY_CONTAINER } from '../../../src/configuration/DependecyContainer';
import { application } from '../../../src/infrastructure/api/Application';
import { EnvioEntity } from '../../../src/domain/entities/EnvioEntity';
import { 
    envioValidoFixture, 
    cotizacionValidaFixture,
    actualizarEstadoEntregadoFixture 
} from '../../fixtures/envioFixtures';

import { CotizarEnvioAppService } from '../../../src/application/services/CotizarEnvioAppService';
import { RegistrarEnvioAppService } from '../../../src/application/services/RegistrarEnvioAppService';
import { ConsultarEnvioAppService } from '../../../src/application/services/ConsultarEnvioAppService';
import { ActualizarEstadoAppService } from '../../../src/application/services/ActualizarEstadoAppService';
import { ConsultarTarifasAppService } from '../../../src/application/services/ConsultarTarifasAppService';

describe('Comprehensive Integration Tests - Gestión de Envíos', () => {
    let mockRepo: any;
    let mockCache: any;
    let mockDb: any;

    const safeBind = (type: symbol, value: any, isConstant = true) => {
        if (DEPENDENCY_CONTAINER.isBound(type)) {
            DEPENDENCY_CONTAINER.unbind(type);
        }
        if (isConstant) {
            DEPENDENCY_CONTAINER.bind(type).toConstantValue(value);
        } else {
            DEPENDENCY_CONTAINER.bind(type).to(value);
        }
    };

    beforeAll(async () => {
        mockDb = { 
            connect: jest.fn(), 
            query: jest.fn().mockResolvedValue({ rows: [] }),
            disconnect: jest.fn(),
            tx: jest.fn((fn) => fn({ none: jest.fn(), one: jest.fn(), manyOrNone: jest.fn(), oneOrNone: jest.fn() }))
        };

        mockCache = { 
            get: jest.fn(), set: jest.fn(), del: jest.fn(),
            delPattern: jest.fn(), isConnected: jest.fn().mockReturnValue(true),
            connect: jest.fn(), disconnect: jest.fn()
        };

        mockRepo = { 
            getTarifa: jest.fn(), save: jest.fn(), findByGuia: jest.fn(), 
            updateEstado: jest.fn(), getHistorial: jest.fn(),
            getNextGuiaNumber: jest.fn(), getAllTarifas: jest.fn()
        };

        safeBind(TYPES.PostgresDatabase, mockDb);
        safeBind(TYPES.CacheService, mockCache);
        safeBind(TYPES.TarifaRepository, mockRepo);
        safeBind(TYPES.EnvioRepository, mockRepo);

        safeBind(TYPES.CotizarEnvioAppService, CotizarEnvioAppService, false);
        safeBind(TYPES.RegistrarEnvioAppService, RegistrarEnvioAppService, false);
        safeBind(TYPES.ConsultarEnvioAppService, ConsultarEnvioAppService, false);
        safeBind(TYPES.ActualizarEstadoAppService, ActualizarEstadoAppService, false);
        safeBind(TYPES.ConsultarTarifasAppService, ConsultarTarifasAppService, false);

        await application.ready();
    });

    afterAll(async () => {
        await application.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockCache.get.mockResolvedValue(null);
        mockRepo.getTarifa.mockResolvedValue({ precioBase: 5000, factorVolumetrico: 2500 });
        mockRepo.getNextGuiaNumber.mockResolvedValue('27012600001');
    });

    const commonEnvioData = {
        id: 'uuid-123',
        numeroGuia: '27012600001',
        tipoProducto: 'PAQUETE' as const,
        origen: 'MEDELLIN',
        destino: 'BOGOTA',
        valorDeclarado: 100000,
        metodoPago: 'FLETE_PAGO' as const,
        valorTotalCotizacion: 15000,
        estado: 'En espera' as const,
        remitente: { nombre: 'Juan', direccion: 'Calle 1', telefono: '123' },
        destinatario: { nombre: 'Maria', direccion: 'Calle 2', telefono: '456' },
        unidades: [{ 
            pesoReal: 5, alto: 10, ancho: 10, largo: 10, 
            pesoVolumetrico: 2, pesoFacturable: 5 
        }]
    };

    describe('API Endpoints', () => {
        it('debería retornar 200 al cotizar exitosamente', async () => {
            const response = await application.inject({
                method: 'POST',
                url: '/coordinadora/gestion-envios/cotizar',
                payload: cotizacionValidaFixture,
            });
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body).data.valorTotalCotizacion).toBeDefined();
        });

        it('debería registrar el envío y persistir en repositorio', async () => {
            const response = await application.inject({
                method: 'POST',
                url: '/coordinadora/gestion-envios/envios',
                payload: envioValidoFixture,
            });
            expect(response.statusCode).toBe(201);
            expect(mockRepo.save).toHaveBeenCalled();
        });

        it('debería validar transiciones de estado incorrectas (400)', async () => {
            const mockEnvio = new EnvioEntity(commonEnvioData);
            mockRepo.findByGuia.mockResolvedValue(mockEnvio);

            const response = await application.inject({
                method: 'PATCH',
                url: '/coordinadora/gestion-envios/envios/27012600001/estado',
                payload: actualizarEstadoEntregadoFixture,
            });
            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body).message).toContain('secuencia válida');
        });
    });

    describe('Domain Logic', () => {
        it('debería redondear hacia arriba las dimensiones y calcular peso volumétrico', async () => {
            const payload = {
                ...cotizacionValidaFixture,
                unidades: [{ pesoReal: 5, alto: 10.1, ancho: 20.2, largo: 30.9 }]
            };

            const response = await application.inject({
                method: 'POST',
                url: '/coordinadora/gestion-envios/cotizar',
                payload,
            });

            const body = JSON.parse(response.body);
            const unidad = body.data.unidades[0];
            
            expect(unidad.alto).toBe(11);
            expect(unidad.ancho).toBe(21);
            expect(unidad.largo).toBe(31);
        });
    });
});