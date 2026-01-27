import 'reflect-metadata';
import { DEPENDENCY_CONTAINER, TYPES } from '@configuration';
import { ConsultarEnvioAppService } from '@application/services/ConsultarEnvioAppService';
import { BadMessageException } from '@domain/exceptions/Exceptions';

describe('ConsultarEnvioAppService', () => {
    let service: ConsultarEnvioAppService;
    let mockRepo: any;
    let mockCache: any;

    beforeEach(() => {
        DEPENDENCY_CONTAINER.snapshot();

        mockRepo = {
            findByGuia: jest.fn(),
            getHistorial: jest.fn(),
        };
        mockCache = {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn()
        };

        if (DEPENDENCY_CONTAINER.isBound(TYPES.EnvioRepository)) {
            DEPENDENCY_CONTAINER.unbind(TYPES.EnvioRepository);
        }
        DEPENDENCY_CONTAINER.bind(TYPES.EnvioRepository).toConstantValue(mockRepo);

        if (DEPENDENCY_CONTAINER.isBound(TYPES.CacheService)) {
            DEPENDENCY_CONTAINER.unbind(TYPES.CacheService);
        }
        DEPENDENCY_CONTAINER.bind(TYPES.CacheService).toConstantValue(mockCache);

        service = new ConsultarEnvioAppService();
    });

    afterEach(() => {
        DEPENDENCY_CONTAINER.restore();
    });

    it('debería lanzar BadMessageException si la guía no existe en DB ni Cache', async () => {
        mockCache.get.mockResolvedValue(null);
        mockRepo.findByGuia.mockResolvedValue(null);

        try {
            await service.run('999999');
            throw new Error('El servicio debería haber lanzado una excepción');
        } catch (error: any) {
            expect(error).toBeInstanceOf(BadMessageException);

            expect(error.message).toContain('No se encontró ningún envío con la guía: 999999');
            
            expect(error.isError).toBe(true);
        }
    });

    it('debería retornar datos desde el repositorio si no están en cache', async () => {
        const mockData = {
            id: '1',
            numeroGuia: '123',
            estado: 'En espera',
            tipoProducto: 'Caja',
            origen: 'Medellín',
            destino: 'Bogotá',
            remitente: { nombre: 'Juan', direccion: 'Calle 1', telefono: '123' },
            destinatario: { nombre: 'Maria', direccion: 'Calle 2', telefono: '456', infoAdicional: '' },
            valorTotalCotizacion: 10000,
            moneda: 'COP',
            metodoPago: 'Efectivo',
            unidades: [],
            fechaCreacion: new Date(),
            fechaActualizacion: new Date()
        };

        const mockEnvioEntity = {
            ...mockData,
            toPrimitives: () => mockData
        };

        mockCache.get.mockResolvedValue(null);
        mockRepo.findByGuia.mockResolvedValue(mockEnvioEntity);
        mockRepo.getHistorial.mockResolvedValue([]);

        const result: any = await service.run('123');

        expect(result.isError).toBe(false);
        expect(result.data.numeroGuia).toBe('123');
        expect(mockCache.set).toHaveBeenCalled();
    });
});