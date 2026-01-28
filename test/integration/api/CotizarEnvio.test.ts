import 'reflect-metadata';
import { DEPENDENCY_CONTAINER, TYPES } from '@configuration';
import { CotizarEnvioAppService } from '@application/services/CotizarEnvioAppService';
import { BadMessageException } from '@domain/exceptions/Exceptions';

/**
 * TESTS UNITARIOS PARA CotizarEnvioAppService
 * * Objetivo: Alcanzar 100% de cobertura en CotizarEnvioAppService
 * Cubre:
 * - Cache HIT/MISS
 * - Tarifa no encontrada (Excepciones)
 * - Cálculo de múltiples unidades
 * - Normalización de ciudades
 * - Diferentes tipos de productos
 */
describe('CotizarEnvioAppService - Cobertura Completa', () => {
    let service: CotizarEnvioAppService;
    let mockTarifaRepository: any;
    let mockCacheService: any;

    beforeEach(() => {
        DEPENDENCY_CONTAINER.snapshot();

        mockTarifaRepository = {
            getTarifa: jest.fn(),
        };

        mockCacheService = {
            get: jest.fn(),
            set: jest.fn(),
        };

        if (DEPENDENCY_CONTAINER.isBound(TYPES.TarifaRepository)) {
            DEPENDENCY_CONTAINER.unbind(TYPES.TarifaRepository);
        }
        DEPENDENCY_CONTAINER.bind(TYPES.TarifaRepository).toConstantValue(mockTarifaRepository);

        if (DEPENDENCY_CONTAINER.isBound(TYPES.CacheService)) {
            DEPENDENCY_CONTAINER.unbind(TYPES.CacheService);
        }
        DEPENDENCY_CONTAINER.bind(TYPES.CacheService).toConstantValue(mockCacheService);

        service = new CotizarEnvioAppService();
    });

    afterEach(() => {
        DEPENDENCY_CONTAINER.restore();
    });

    describe('Cache HIT', () => {
        it('debería retornar tarifa desde caché sin consultar BD', async () => {
            const cachedTarifa = { precioBase: 5000, factorVolumetrico: 2500 };
            mockCacheService.get.mockResolvedValue(cachedTarifa);

            const result = await service.run({
                tipoProducto: 'PAQUETE',
                origen: 'medellin',
                destino: 'bogota',
                unidades: [{ pesoReal: 5, alto: 30, ancho: 20, largo: 40 }],
            });

            expect(result.isError).toBe(false);
            expect(mockCacheService.get).toHaveBeenCalledWith('tarifa:MEDELLIN:BOGOTA:PAQUETE');
            expect(mockTarifaRepository.getTarifa).not.toHaveBeenCalled();
            expect((result.data as any).valorTotalCotizacion).toBeGreaterThan(0);
        });

        it('debería usar caché para múltiples consultas consecutivas', async () => {
            const cachedTarifa = { precioBase: 5000, factorVolumetrico: 2500 };
            mockCacheService.get.mockResolvedValue(cachedTarifa);

            await service.run({
                tipoProducto: 'PAQUETE',
                origen: 'MEDELLIN',
                destino: 'BOGOTA',
                unidades: [{ pesoReal: 5, alto: 30, ancho: 20, largo: 40 }],
            });

            await service.run({
                tipoProducto: 'PAQUETE',
                origen: 'MEDELLIN',
                destino: 'BOGOTA',
                unidades: [{ pesoReal: 3, alto: 20, ancho: 15, largo: 25 }],
            });

            expect(mockCacheService.get).toHaveBeenCalledTimes(2);
            expect(mockTarifaRepository.getTarifa).not.toHaveBeenCalled();
        });
    });

    describe('Cache MISS', () => {
        it('debería consultar BD cuando no está en caché', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockTarifaRepository.getTarifa.mockResolvedValue({ precioBase: 5000, factorVolumetrico: 2500 });

            const result = await service.run({
                tipoProducto: 'PAQUETE',
                origen: 'MEDELLIN',
                destino: 'BOGOTA',
                unidades: [{ pesoReal: 5, alto: 30, ancho: 20, largo: 40 }],
            });

            expect(result.isError).toBe(false);
            expect(mockCacheService.get).toHaveBeenCalled();
            expect(mockTarifaRepository.getTarifa).toHaveBeenCalledWith('MEDELLIN', 'BOGOTA', 'PAQUETE');
            expect(mockCacheService.set).toHaveBeenCalled();
        });

        it('debería guardar en caché después de consultar BD', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifa = { precioBase: 5000, factorVolumetrico: 2500 };
            mockTarifaRepository.getTarifa.mockResolvedValue(tarifa);

            await service.run({
                tipoProducto: 'PAQUETE',
                origen: 'MEDELLIN',
                destino: 'BOGOTA',
                unidades: [{ pesoReal: 5, alto: 30, ancho: 20, largo: 40 }],
            });

            expect(mockCacheService.set).toHaveBeenCalledWith(
                'tarifa:MEDELLIN:BOGOTA:PAQUETE',
                tarifa,
                600
            );
        });
    });

    describe('Tarifa no encontrada', () => {
        it('debería lanzar excepción cuando tarifa no existe en caché ni BD', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockTarifaRepository.getTarifa.mockResolvedValue(null);

            try {
                await service.run({
                    tipoProducto: 'PAQUETE',
                    origen: 'MEDELLIN',
                    destino: 'BOGOTA',
                    unidades: [{ pesoReal: 5, alto: 30, ancho: 20, largo: 40 }],
                });
                fail('Debería haber lanzado excepción');
            } catch (error: any) {
                expect(error).toBeInstanceOf(BadMessageException);
                // CORRECCIÓN: Usar el mensaje que realmente devuelve el servicio
                expect(error.message).toContain('No se encontró una tarifa');
                expect(error.cause).toBe('Ruta no encontrada');
            }
        });

        it('debería lanzar excepción con mensaje descriptivo', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockTarifaRepository.getTarifa.mockResolvedValue(null);

            try {
                await service.run({
                    tipoProducto: 'DOCUMENTO',
                    origen: 'CALI',
                    destino: 'CARTAGENA',
                    unidades: [{ pesoReal: 0.5, alto: 30, ancho: 21, largo: 29.7 }],
                });
                fail('Debería haber lanzado excepción');
            } catch (error: any) {
                expect(error.message).toContain('No se encontró una tarifa');
            }
        });
    });

    describe('Cálculo de Cotización', () => {
        it('debería calcular correctamente con una unidad', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockTarifaRepository.getTarifa.mockResolvedValue({ precioBase: 5000, factorVolumetrico: 2500 });

            const result = await service.run({
                tipoProducto: 'PAQUETE',
                origen: 'MEDELLIN',
                destino: 'BOGOTA',
                unidades: [{ pesoReal: 2, alto: 10, ancho: 10, largo: 10 }],
            });

            expect((result.data as any).valorTotalCotizacion).toBe(10000);
        });

        it('debería calcular correctamente con múltiples unidades', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockTarifaRepository.getTarifa.mockResolvedValue({ precioBase: 5000, factorVolumetrico: 2500 });

            const result = await service.run({
                tipoProducto: 'PAQUETE',
                origen: 'MEDELLIN',
                destino: 'BOGOTA',
                unidades: [
                    { pesoReal: 2, alto: 10, ancho: 10, largo: 10 },
                    { pesoReal: 3, alto: 15, ancho: 15, largo: 15 },
                ],
            });

            expect((result.data as any).valorTotalCotizacion).toBe(25000);
            expect((result.data as any).unidades).toHaveLength(2);
        });

        it('debería usar peso real cuando es mayor que volumétrico', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockTarifaRepository.getTarifa.mockResolvedValue({ precioBase: 5000, factorVolumetrico: 2500 });

            const result = await service.run({
                tipoProducto: 'PAQUETE',
                origen: 'MEDELLIN',
                destino: 'BOGOTA',
                unidades: [{ pesoReal: 10, alto: 10, ancho: 10, largo: 10 }],
            });

            expect((result.data as any).unidades[0].pesoFacturable).toBe(10);
            expect((result.data as any).valorTotalCotizacion).toBe(50000);
        });

        it('debería redondear dimensiones hacia arriba', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockTarifaRepository.getTarifa.mockResolvedValue({ precioBase: 5000, factorVolumetrico: 2500 });

            const result = await service.run({
                tipoProducto: 'PAQUETE',
                origen: 'MEDELLIN',
                destino: 'BOGOTA',
                unidades: [{ pesoReal: 1, alto: 10.1, ancho: 10.2, largo: 10.3 }],
            });

            expect((result.data as any).unidades[0].alto).toBe(11);
            expect((result.data as any).unidades[0].ancho).toBe(11);
            expect((result.data as any).unidades[0].largo).toBe(11);
        });
    });

    describe('Normalización de Datos', () => {
        it('debería normalizar ciudades a mayúsculas', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockTarifaRepository.getTarifa.mockResolvedValue({ precioBase: 5000, factorVolumetrico: 2500 });

            const result = await service.run({
                tipoProducto: 'PAQUETE',
                origen: 'medellin',
                destino: 'bogota',
                unidades: [{ pesoReal: 5, alto: 30, ancho: 20, largo: 40 }],
            });

            expect((result.data as any).ruta).toBe('MEDELLIN - BOGOTA');
            expect(mockTarifaRepository.getTarifa).toHaveBeenCalledWith('MEDELLIN', 'BOGOTA', 'PAQUETE');
        });

        it('debería normalizar ciudades mixtas', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockTarifaRepository.getTarifa.mockResolvedValue({ precioBase: 5000, factorVolumetrico: 2500 });

            await service.run({
                tipoProducto: 'PAQUETE',
                origen: 'MeDeLLin',
                destino: 'BoGoTA',
                unidades: [{ pesoReal: 5, alto: 30, ancho: 20, largo: 40 }],
            });

            expect(mockTarifaRepository.getTarifa).toHaveBeenCalledWith('MEDELLIN', 'BOGOTA', 'PAQUETE');
        });

        it('debería retornar moneda COP', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockTarifaRepository.getTarifa.mockResolvedValue({ precioBase: 5000, factorVolumetrico: 2500 });

            const result = await service.run({
                tipoProducto: 'PAQUETE',
                origen: 'MEDELLIN',
                destino: 'BOGOTA',
                unidades: [{ pesoReal: 5, alto: 30, ancho: 20, largo: 40 }],
            });

            expect((result.data as any).moneda).toBe('COP');
        });
    });

    describe('Tipos de Productos', () => {
        it('debería cotizar tipo PAQUETE', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockTarifaRepository.getTarifa.mockResolvedValue({ precioBase: 5000, factorVolumetrico: 2500 });

            const result = await service.run({
                tipoProducto: 'PAQUETE',
                origen: 'MEDELLIN',
                destino: 'BOGOTA',
                unidades: [{ pesoReal: 5, alto: 30, ancho: 20, largo: 40 }],
            });

            expect((result.data as any).tipoProducto).toBe('PAQUETE');
        });

        it('debería cotizar tipo DOCUMENTO', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockTarifaRepository.getTarifa.mockResolvedValue({ precioBase: 8000, factorVolumetrico: 2500 });

            const result = await service.run({
                tipoProducto: 'DOCUMENTO',
                origen: 'MEDELLIN',
                destino: 'BOGOTA',
                unidades: [{ pesoReal: 0.5, alto: 30, ancho: 21, largo: 29.7 }],
            });

            expect((result.data as any).tipoProducto).toBe('DOCUMENTO');
            expect(mockTarifaRepository.getTarifa).toHaveBeenCalledWith('MEDELLIN', 'BOGOTA', 'DOCUMENTO');
        });
    });

    describe('Respuesta', () => {
        it('debería retornar estructura correcta', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockTarifaRepository.getTarifa.mockResolvedValue({ precioBase: 5000, factorVolumetrico: 2500 });

            const result = await service.run({
                tipoProducto: 'PAQUETE',
                origen: 'MEDELLIN',
                destino: 'BOGOTA',
                unidades: [{ pesoReal: 5, alto: 30, ancho: 20, largo: 40 }],
            });

            expect(result.isError).toBe(false);
            const data = result.data as any;
            expect(data).toHaveProperty('tipoProducto');
            expect(data).toHaveProperty('ruta');
            expect(data).toHaveProperty('unidades');
            expect(data).toHaveProperty('valorTotalCotizacion');
            expect(data).toHaveProperty('moneda');
        });

        it('debería retornar unidades con todos los campos calculados', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockTarifaRepository.getTarifa.mockResolvedValue({ precioBase: 5000, factorVolumetrico: 2500 });

            const result = await service.run({
                tipoProducto: 'PAQUETE',
                origen: 'MEDELLIN',
                destino: 'BOGOTA',
                unidades: [{ pesoReal: 5, alto: 30, ancho: 20, largo: 40 }],
            });

            const unidad = (result.data as any).unidades[0];
            expect(unidad).toHaveProperty('pesoReal');
            expect(unidad).toHaveProperty('alto');
            expect(unidad).toHaveProperty('ancho');
            expect(unidad).toHaveProperty('largo');
            expect(unidad).toHaveProperty('pesoVolumetrico');
            expect(unidad).toHaveProperty('pesoFacturable');
        });
    });

    describe('Factor Volumétrico', () => {
        it('debería usar factor volumétrico de tarifa', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockTarifaRepository.getTarifa.mockResolvedValue({ precioBase: 5000, factorVolumetrico: 3000 });

            const result = await service.run({
                tipoProducto: 'PAQUETE',
                origen: 'MEDELLIN',
                destino: 'BOGOTA',
                unidades: [{ pesoReal: 1, alto: 30, ancho: 20, largo: 40 }],
            });

            expect((result.data as any).unidades[0].pesoVolumetrico).toBe(8);
        });
    });
});