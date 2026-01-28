import 'reflect-metadata';
import { DEPENDENCY_CONTAINER, TYPES } from '@configuration';
import { ConsultarTarifasAppService } from '@application/services/ConsultarTarifasAppService';

/**
 * TESTS UNITARIOS PARA ConsultarTarifasAppService
 * 
 * Objetivo: Alcanzar 100% de cobertura en ConsultarTarifasAppService
 * Cubre:
 * - Cache HIT/MISS
 * - Agrupación de tarifas por ruta
 * - Estructura de respuesta
 * - Múltiples tarifas
 */
describe('ConsultarTarifasAppService - Cobertura Completa', () => {
    let service: ConsultarTarifasAppService;
    let mockTarifaRepository: any;
    let mockCacheService: any;

    beforeEach(() => {
        DEPENDENCY_CONTAINER.snapshot();

        mockTarifaRepository = {
            getAllTarifas: jest.fn(),
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

        service = new ConsultarTarifasAppService();
    });

    afterEach(() => {
        DEPENDENCY_CONTAINER.restore();
    });

    describe('Cache HIT', () => {
        it('debería retornar tarifas desde caché sin consultar BD', async () => {
            const cachedTarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 }
            ];
            mockCacheService.get.mockResolvedValue(cachedTarifas);

            const result = await service.run();

            expect(result.isError).toBe(false);
            expect((result.data as any).fromCache).toBe(true);
            expect(mockTarifaRepository.getAllTarifas).not.toHaveBeenCalled();
            expect(mockCacheService.get).toHaveBeenCalledWith('tarifas:all');
        });

        it('debería indicar que proviene de caché', async () => {
            const cachedTarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 }
            ];
            mockCacheService.get.mockResolvedValue(cachedTarifas);

            const result = await service.run();

            expect((result.data as any).fromCache).toBe(true);
        });
    });

    describe('Cache MISS', () => {
        it('debería consultar BD cuando no está en caché', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 }
            ];
            mockTarifaRepository.getAllTarifas.mockResolvedValue(tarifas);

            const result = await service.run();

            expect(result.isError).toBe(false);
            expect(mockCacheService.get).toHaveBeenCalled();
            expect(mockTarifaRepository.getAllTarifas).toHaveBeenCalled();
        });

        it('debería guardar en caché después de consultar BD', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 }
            ];
            mockTarifaRepository.getAllTarifas.mockResolvedValue(tarifas);

            await service.run();

            expect(mockCacheService.set).toHaveBeenCalledWith('tarifas:all', tarifas, 600);
        });

        it('debería indicar que NO proviene de caché', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 }
            ];
            mockTarifaRepository.getAllTarifas.mockResolvedValue(tarifas);

            const result = await service.run();

            expect((result.data as any).fromCache).toBe(false);
        });
    });

    describe('Agrupación de Tarifas', () => {
        it('debería agrupar tarifas por ruta', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 },
                { id: 2, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'DOCUMENTO', precioBase: 8000, factorVolumetrico: 2500 }
            ];
            mockTarifaRepository.getAllTarifas.mockResolvedValue(tarifas);

            const result = await service.run();

            expect((result.data as any).tarifas).toHaveLength(1);
            expect((result.data as any).tarifas[0].origen).toBe('MEDELLIN');
            expect((result.data as any).tarifas[0].destino).toBe('BOGOTA');
            expect((result.data as any).tarifas[0].productos).toHaveLength(2);
        });

        it('debería crear múltiples rutas cuando hay diferentes destinos', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 },
                { id: 2, origen: 'BOGOTA', destino: 'CALI', tipoProducto: 'PAQUETE', precioBase: 6000, factorVolumetrico: 2500 }
            ];
            mockTarifaRepository.getAllTarifas.mockResolvedValue(tarifas);

            const result = await service.run();

            expect((result.data as any).tarifas).toHaveLength(2);
        });

        it('debería incluir información de productos en cada ruta', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 },
                { id: 2, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'DOCUMENTO', precioBase: 8000, factorVolumetrico: 2500 }
            ];
            mockTarifaRepository.getAllTarifas.mockResolvedValue(tarifas);

            const result = await service.run();

            const ruta = (result.data as any).tarifas[0];
            expect(ruta.productos[0]).toHaveProperty('tipoProducto');
            expect(ruta.productos[0]).toHaveProperty('precioBase');
            expect(ruta.productos[0]).toHaveProperty('factorVolumetrico');
        });
    });

    describe('Estructura de Respuesta', () => {
        it('debería retornar estructura completa', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 }
            ];
            mockTarifaRepository.getAllTarifas.mockResolvedValue(tarifas);

            const result = await service.run();

            expect((result.data as any)).toHaveProperty('totalTarifas');
            expect((result.data as any)).toHaveProperty('moneda');
            expect((result.data as any)).toHaveProperty('descripcion');
            expect((result.data as any)).toHaveProperty('fromCache');
            expect((result.data as any)).toHaveProperty('tarifas');
            expect((result.data as any)).toHaveProperty('tarifasDetalle');
        });

        it('debería retornar total de tarifas correcto', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 },
                { id: 2, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'DOCUMENTO', precioBase: 8000, factorVolumetrico: 2500 },
                { id: 3, origen: 'BOGOTA', destino: 'CALI', tipoProducto: 'PAQUETE', precioBase: 6000, factorVolumetrico: 2500 }
            ];
            mockTarifaRepository.getAllTarifas.mockResolvedValue(tarifas);

            const result = await service.run();

            expect((result.data as any).totalTarifas).toBe(3);
        });

        it('debería retornar moneda COP', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 }
            ];
            mockTarifaRepository.getAllTarifas.mockResolvedValue(tarifas);

            const result = await service.run();

            expect((result.data as any).moneda).toBe('COP');
        });

        it('debería retornar descripción de cálculo de peso', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 }
            ];
            mockTarifaRepository.getAllTarifas.mockResolvedValue(tarifas);

            const result = await service.run();

            expect((result.data as any).descripcion).toContain('peso facturable');
            expect((result.data as any).descripcion).toContain('peso volumétrico');
        });
    });

    describe('Tarifas Detalle', () => {
        it('debería incluir lista detallada de tarifas', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 },
                { id: 2, origen: 'BOGOTA', destino: 'CALI', tipoProducto: 'DOCUMENTO', precioBase: 8000, factorVolumetrico: 2500 }
            ];
            mockTarifaRepository.getAllTarifas.mockResolvedValue(tarifas);

            const result = await service.run();

            expect((result.data as any).tarifasDetalle).toHaveLength(2);
        });

        it('debería incluir todos los campos en tarifas detalle', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 }
            ];
            mockTarifaRepository.getAllTarifas.mockResolvedValue(tarifas);

            const result = await service.run();

            const tarifa = (result.data as any).tarifasDetalle[0];
            expect(tarifa).toHaveProperty('id');
            expect(tarifa).toHaveProperty('origen');
            expect(tarifa).toHaveProperty('destino');
            expect(tarifa).toHaveProperty('tipoProducto');
            expect(tarifa).toHaveProperty('precioBase');
            expect(tarifa).toHaveProperty('factorVolumetrico');
        });
    });

    describe('Casos Edge', () => {
        it('debería manejar lista vacía de tarifas', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockTarifaRepository.getAllTarifas.mockResolvedValue([]);

            const result = await service.run();

            expect(result.isError).toBe(false);
            expect((result.data as any).totalTarifas).toBe(0);
            expect((result.data as any).tarifas).toHaveLength(0);
            expect((result.data as any).tarifasDetalle).toHaveLength(0);
        });

        it('debería manejar una sola tarifa', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 }
            ];
            mockTarifaRepository.getAllTarifas.mockResolvedValue(tarifas);

            const result = await service.run();

            expect((result.data as any).totalTarifas).toBe(1);
            expect((result.data as any).tarifas).toHaveLength(1);
        });

        it('debería manejar muchas tarifas correctamente', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifas = Array.from({ length: 100 }, (_, i) => ({
                id: i + 1,
                origen: 'MEDELLIN',
                destino: 'BOGOTA',
                tipoProducto: i % 2 === 0 ? 'PAQUETE' : 'DOCUMENTO',
                precioBase: 5000 + i * 100,
                factorVolumetrico: 2500
            }));
            mockTarifaRepository.getAllTarifas.mockResolvedValue(tarifas);

            const result = await service.run();

            expect((result.data as any).totalTarifas).toBe(100);
            expect((result.data as any).tarifasDetalle).toHaveLength(100);
        });

        it('debería agrupar correctamente con múltiples rutas y productos', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 },
                { id: 2, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'DOCUMENTO', precioBase: 8000, factorVolumetrico: 2500 },
                { id: 3, origen: 'BOGOTA', destino: 'CALI', tipoProducto: 'PAQUETE', precioBase: 6000, factorVolumetrico: 2500 },
                { id: 4, origen: 'BOGOTA', destino: 'CALI', tipoProducto: 'DOCUMENTO', precioBase: 9000, factorVolumetrico: 2500 },
                { id: 5, origen: 'CALI', destino: 'BARRANQUILLA', tipoProducto: 'PAQUETE', precioBase: 7000, factorVolumetrico: 2500 }
            ];
            mockTarifaRepository.getAllTarifas.mockResolvedValue(tarifas);

            const result = await service.run();

            expect((result.data as any).totalTarifas).toBe(5);
            expect((result.data as any).tarifas).toHaveLength(3);
            
            // Verificar que cada ruta tiene los productos correctos
            const rutaMB = (result.data as any).tarifas.find((r: any) => r.origen === 'MEDELLIN' && r.destino === 'BOGOTA');
            expect(rutaMB.productos).toHaveLength(2);
            
            const rutaBC = (result.data as any).tarifas.find((r: any) => r.origen === 'BOGOTA' && r.destino === 'CALI');
            expect(rutaBC.productos).toHaveLength(2);
        });
    });

    describe('TTL de Caché', () => {
        it('debería usar TTL de 600 segundos', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 }
            ];
            mockTarifaRepository.getAllTarifas.mockResolvedValue(tarifas);

            await service.run();

            expect(mockCacheService.set).toHaveBeenCalledWith('tarifas:all', tarifas, 600);
        });
    });

    describe('IsError', () => {
        it('debería retornar isError = false', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 }
            ];
            mockTarifaRepository.getAllTarifas.mockResolvedValue(tarifas);

            const result = await service.run();

            expect(result.isError).toBe(false);
        });
    });
});
