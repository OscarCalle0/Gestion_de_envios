import 'reflect-metadata';
import { TYPES } from '../../../src/configuration/Types';
import { DEPENDENCY_CONTAINER } from '../../../src/configuration/DependecyContainer';
import { ActualizarEstadoAppService } from '../../../src/application/services/ActualizarEstadoAppService';
import { BadMessageException } from '../../../src/domain/exceptions/Exceptions';

describe('ActualizarEstadoAppService - Cobertura de Errores', () => {
    let service: ActualizarEstadoAppService;
    let mockEnvioRepository: any;
    let mockCache: any;

    beforeEach(() => {
        DEPENDENCY_CONTAINER.snapshot();

        mockEnvioRepository = {
            findByGuia: jest.fn(),
            updateEstado: jest.fn(),
            getHistorial: jest.fn(),
        };
        mockCache = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            disconnect: jest.fn(),
        };

        if (DEPENDENCY_CONTAINER.isBound(TYPES.EnvioRepository)) {
            DEPENDENCY_CONTAINER.unbind(TYPES.EnvioRepository);
        }
        DEPENDENCY_CONTAINER.bind(TYPES.EnvioRepository).toConstantValue(mockEnvioRepository);

        if (DEPENDENCY_CONTAINER.isBound(TYPES.CacheService)) {
            DEPENDENCY_CONTAINER.unbind(TYPES.CacheService);
        }
        DEPENDENCY_CONTAINER.bind(TYPES.CacheService).toConstantValue(mockCache);

        service = new ActualizarEstadoAppService(mockEnvioRepository, mockCache);
    });

    afterEach(() => {
        DEPENDENCY_CONTAINER.restore();
        jest.clearAllMocks();
    });

    afterAll(async () => {
        if (mockCache && typeof mockCache.disconnect === 'function') {
            await mockCache.disconnect();
        }
    });

    it('debería lanzar error si la guía no existe', async () => {
        mockEnvioRepository.findByGuia.mockResolvedValue(null);

        try {
            await service.run('GUIA-NULL', { estado: 'En tránsito' });
            throw new Error('El servicio debería haber lanzado una excepción');
        } catch (error: any) {
            if (error.message === 'El servicio debería haber lanzado una excepción') {
                throw error;
            }
            expect(error).toBeInstanceOf(BadMessageException);
            expect(error.message).toContain('No se encontró ningún envío con la guía');
        }
    });

    it('debería lanzar error si updateEstado falla y retorna null', async () => {
        mockEnvioRepository.findByGuia.mockResolvedValue({
            id: '1',
            numeroGuia: '23012600001',
            estado: 'En espera',
            origen: 'MEDELLIN',
            destino: 'BOGOTA'
        });
        mockEnvioRepository.updateEstado.mockResolvedValue(null);

        try {
            await service.run('23012600001', { estado: 'En tránsito' });
            throw new Error('El servicio debería haber lanzado una excepción');
        } catch (error: any) {
            if (error.message === 'El servicio debería haber lanzado una excepción') {
                throw error;
            }
            expect(error).toBeInstanceOf(BadMessageException);
            expect(error.message).toBe('No se pudo actualizar el estado del envío');
        }
    });
});