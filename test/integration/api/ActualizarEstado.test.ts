import 'reflect-metadata';
import { DEPENDENCY_CONTAINER, TYPES } from '@configuration';
import { ActualizarEstadoAppService } from '@application/services/ActualizarEstadoAppService';
import { BadMessageException } from '@domain/exceptions/Exceptions';
import { EnvioEntity } from '@domain/entities/EnvioEntity';

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
        };

        if (DEPENDENCY_CONTAINER.isBound(TYPES.EnvioRepository)) {
            DEPENDENCY_CONTAINER.unbind(TYPES.EnvioRepository);
        }
        DEPENDENCY_CONTAINER.bind(TYPES.EnvioRepository).toConstantValue(mockEnvioRepository);

        if (DEPENDENCY_CONTAINER.isBound(TYPES.CacheService)) {
            DEPENDENCY_CONTAINER.unbind(TYPES.CacheService);
        }
        DEPENDENCY_CONTAINER.bind(TYPES.CacheService).toConstantValue(mockCacheService);

        service = new ActualizarEstadoAppService();
    });

    afterEach(() => {
        DEPENDENCY_CONTAINER.restore();
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

        it('debería rechazar estado con valor null', async () => {
            try {
                await service.run('27012600001', { estado: null as any });
                throw new Error('Debería haber lanzado excepción');
            } catch (error: any) {
                expect(error).toBeInstanceOf(BadMessageException);
                expect(error.message).toContain('no es válido');
            }
        });

        it('debería rechazar estado con valor undefined', async () => {
            try {
                await service.run('27012600001', { estado: undefined as any });
                throw new Error('Debería haber lanzado excepción');
            } catch (error: any) {
                expect(error).toBeInstanceOf(BadMessageException);
            }
        });

        it('debería aceptar estado "En tránsito" si el actual es "En espera"', async () => {
            const mockEnvio = new EnvioEntity({
                id: 'ENV-1',
                numeroGuia: '27012600001',
                estado: 'En espera' // Estado base
            } as any);

            const mockEnvioActualizado = new EnvioEntity({
                ...mockEnvio,
                estado: 'En tránsito'
            } as any);

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

        it('debería rechazar En tránsito → En espera (retroceso)', async () => {
            const mockEnvio = new EnvioEntity({
                numeroGuia: '27012600001',
                estado: 'En tránsito'
            } as any);

            mockEnvioRepository.findByGuia.mockResolvedValue(mockEnvio);

            try {
                await service.run('27012600001', { estado: 'En espera' });
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

            // Ajuste: Eliminamos la fecha para evitar problemas de comparación de objetos Date
            const historial = [
                { 
                    estadoAnterior: 'En espera', 
                    estadoNuevo: 'En tránsito', 
                    ubicacion: 'Centro', 
                    observacion: 'En ruta'
                    // No incluimos fecha para que el toEqual no falle por milisegundos o undefined
                }
            ];

            mockEnvioRepository.findByGuia.mockResolvedValue(mockEnvio);
            mockEnvioRepository.updateEstado.mockResolvedValue(mockEnvioActualizado);
            mockEnvioRepository.getHistorial.mockResolvedValue(historial);

            const result = await service.run('27012600001', { estado: 'En tránsito' });

            expect(mockEnvioRepository.getHistorial).toHaveBeenCalledWith('ENV-1');
            // Usamos objectContaining para que ignore si hay campos extra como la fecha
            expect((result.data as any).historialEstados[0]).toEqual(expect.objectContaining(historial[0]));
        });
    });

    describe('Respuesta', () => {
        it('debería incluir mensaje descriptivo', async () => {
            const mockEnvio = new EnvioEntity({
                numeroGuia: '27012600001',
                estado: 'En espera'
            } as any);

            const mockEnvioActualizado = new EnvioEntity({
                ...mockEnvio,
                estado: 'En tránsito'
            } as any);

            mockEnvioRepository.findByGuia.mockResolvedValue(mockEnvio);
            mockEnvioRepository.updateEstado.mockResolvedValue(mockEnvioActualizado);
            mockEnvioRepository.getHistorial.mockResolvedValue([]);

            const result = await service.run('27012600001', { estado: 'En tránsito' });

            expect((result.data as any).mensaje).toBeDefined();
            expect((result.data as any).estadoActual).toBe('En tránsito');
        });
    });
});