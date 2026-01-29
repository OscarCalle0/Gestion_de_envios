import 'reflect-metadata';
import { TYPES } from '../../../src/configuration/Types';
import { DEPENDENCY_CONTAINER } from '../../../src/configuration/DependecyContainer';
import { ActualizarEstadoAppService } from '../../../src/application/services/ActualizarEstadoAppService';
import { BadMessageException } from '../../../src/domain/exceptions/Exceptions';
import { EnvioEntity } from '../../../src/domain/entities/EnvioEntity';

describe('ActualizarEstadoAppService - Cobertura Completa', () => {
    let service: ActualizarEstadoAppService;
    let mockEnvioRepository: any;
    let mockCacheService: any;

    beforeEach(() => {
        DEPENDENCY_CONTAINER.snapshot();

        mockEnvioRepository = {
            findByGuia: jest.fn(),
            updateEstado: jest.fn(),
            getHistorial: jest.fn(),
        };

        mockCacheService = {
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
        DEPENDENCY_CONTAINER.bind(TYPES.CacheService).toConstantValue(mockCacheService);

        service = new ActualizarEstadoAppService(mockEnvioRepository, mockCacheService);
    });

    afterEach(() => {
        DEPENDENCY_CONTAINER.restore();
        jest.clearAllMocks();
    });

    afterAll(async () => {
        if (mockCacheService && typeof mockCacheService.disconnect === 'function') {
            await mockCacheService.disconnect();
        }
    });

    describe('Validación de Estado', () => {
        it('debería rechazar estado inválido', async () => {
            try {
                await service.run('27012600001', { estado: 'Cancelado' as any });
                throw new Error('Debería haber lanzado excepción');
            } catch (error: any) {
                expect(error).toBeInstanceOf(BadMessageException);
                expect(error.message).toContain('no es válido');
            }
        });

        it('debería aceptar estado "En tránsito" si el actual es "En espera"', async () => {
            const mockEnvio = new EnvioEntity({
                id: 'ENV-1',
                numeroGuia: '27012600001',
                estado: 'En espera',
                tipoProducto: 'PAQUETE',
                origen: 'MEDELLIN',
                destino: 'BOGOTA',
                valorDeclarado: 1000,
                metodoPago: 'FLETE_PAGO',
                unidades: [],
                valorTotalCotizacion: 5000,
                remitente: { nombre: 'R', direccion: 'D', telefono: 'T' },
                destinatario: { nombre: 'D', direccion: 'D', telefono: 'T' }
            });

            const mockEnvioActualizado = new EnvioEntity({
                ...mockEnvio,
                estado: 'En tránsito'
            });

            mockEnvioRepository.findByGuia.mockResolvedValue(mockEnvio);
            mockEnvioRepository.updateEstado.mockResolvedValue(mockEnvioActualizado);
            mockEnvioRepository.getHistorial.mockResolvedValue([]);

            const result = await service.run('27012600001', { estado: 'En tránsito' });
            expect(result.isError).toBe(false);
            expect((result.data as any).estadoActual).toBe('En tránsito');
        });
    });

    describe('Transiciones de Estado', () => {
        it('debería rechazar En espera → Entregado (saltar estado)', async () => {
            const mockEnvio = new EnvioEntity({
                numeroGuia: '27012600001',
                estado: 'En espera'
            } as any);

            mockEnvioRepository.findByGuia.mockResolvedValue(mockEnvio);

            try {
                await service.run('27012600001', { estado: 'Entregado' });
                throw new Error('Debería haber lanzado excepción');
            } catch (error: any) {
                expect(error).toBeInstanceOf(BadMessageException);
                expect(error.message).toContain('La secuencia válida es');
            }
        });
    });

    describe('Historial de Cambios', () => {
        it('debería obtener historial después de actualizar', async () => {
            const mockEnvio = new EnvioEntity({
                id: 'ENV-1',
                numeroGuia: '27012600001',
                estado: 'En espera'
            } as any);

            const mockEnvioActualizado = new EnvioEntity({
                ...mockEnvio,
                estado: 'En tránsito'
            } as any);

            const historial = [
                {
                    estadoAnterior: 'En espera',
                    estadoNuevo: 'En tránsito',
                    ubicacion: 'Centro',
                    observacion: 'En ruta'
                }
            ];

            mockEnvioRepository.findByGuia.mockResolvedValue(mockEnvio);
            mockEnvioRepository.updateEstado.mockResolvedValue(mockEnvioActualizado);
            mockEnvioRepository.getHistorial.mockResolvedValue(historial);

            const result = await service.run('27012600001', { estado: 'En tránsito' });

            expect(mockEnvioRepository.getHistorial).toHaveBeenCalledWith('ENV-1');
            expect((result.data as any).historialEstados[0]).toEqual(expect.objectContaining(historial[0]));
        });
    });
});