import 'reflect-metadata';
import { DEPENDENCY_CONTAINER, TYPES } from '@configuration';
import { ActualizarEstadoAppService } from '@application/services/ActualizarEstadoAppService';
import { BadMessageException } from '@domain/exceptions/Exceptions';

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
        };

        if (DEPENDENCY_CONTAINER.isBound(TYPES.EnvioRepository)) {
            DEPENDENCY_CONTAINER.unbind(TYPES.EnvioRepository);
        }
        DEPENDENCY_CONTAINER.bind(TYPES.EnvioRepository).toConstantValue(mockEnvioRepository);

        if (DEPENDENCY_CONTAINER.isBound(TYPES.CacheService)) {
            DEPENDENCY_CONTAINER.unbind(TYPES.CacheService);
        }
        DEPENDENCY_CONTAINER.bind(TYPES.CacheService).toConstantValue(mockCache);

        service = new ActualizarEstadoAppService();
    });

    afterEach(() => {
        DEPENDENCY_CONTAINER.restore();
    });

    it('debería lanzar error si la guía no existe', async () => {
        mockEnvioRepository.findByGuia.mockResolvedValue(null);

        try {
            await service.run('GUIA-NULL', { estado: 'En tránsito' });
            fail('El servicio debería haber lanzado una excepción');
        } catch (error: any) {
            expect(error).toBeInstanceOf(BadMessageException);
            expect(error.message).toContain('No se encontró ningún envío con la guía');
        }
    });

    it('debería lanzar error si updateEstado falla y retorna null', async () => {
        mockEnvioRepository.findByGuia.mockResolvedValue({
            id: '1',
            numeroGuia: '23012600001',
            estado: 'En espera',
        });
        mockEnvioRepository.updateEstado.mockResolvedValue(null);

        try {
            await service.run('23012600001', { estado: 'En tránsito' });
            fail('El servicio debería haber lanzado una excepción');
        } catch (error: any) {
            expect(error).toBeInstanceOf(BadMessageException);
            
            expect(error.cause).toBe('Error de actualización');
            expect(error.message).toBe('No se pudo actualizar el estado del envío');
        }
    });
});