import 'reflect-metadata';
import { TYPES } from '../../../src/configuration/Types';
import { DEPENDENCY_CONTAINER } from '../../../src/configuration/DependecyContainer';
import { ConsultarTarifasAppService } from '../../../src/application/services/ConsultarTarifasAppService';

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
            disconnect: jest.fn(),
        };

        if (DEPENDENCY_CONTAINER.isBound(TYPES.TarifaRepository)) {
            DEPENDENCY_CONTAINER.unbind(TYPES.TarifaRepository);
        }
        DEPENDENCY_CONTAINER.bind(TYPES.TarifaRepository).toConstantValue(mockTarifaRepository);

        if (DEPENDENCY_CONTAINER.isBound(TYPES.CacheService)) {
            DEPENDENCY_CONTAINER.unbind(TYPES.CacheService);
        }
        DEPENDENCY_CONTAINER.bind(TYPES.CacheService).toConstantValue(mockCacheService);

        service = new ConsultarTarifasAppService(mockTarifaRepository, mockCacheService);
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

    describe('Flujo de Caché (Strategy Pattern)', () => {
        it('debería retornar tarifas desde caché sin consultar BD (HIT)', async () => {
            const cachedTarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 }
            ];
            mockCacheService.get.mockResolvedValue(cachedTarifas);

            const result = await service.run();

            expect(result.isError).toBe(false);
            expect((result.data as any).fromCache).toBe(true);
            expect(mockTarifaRepository.getAllTarifas).not.toHaveBeenCalled();
        });

        it('debería consultar BD y guardar en caché cuando no existe (MISS)', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 }
            ];
            mockTarifaRepository.getAllTarifas.mockResolvedValue(tarifas);

            const result = await service.run();

            expect(result.isError).toBe(false);
            expect(mockCacheService.set).toHaveBeenCalledWith('tarifas:all', tarifas, 600);
            expect((result.data as any).fromCache).toBe(false);
        });
    });

    describe('Lógica de Agrupación y Estructura', () => {
        it('debería agrupar tarifas por ruta única y detallar productos', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifas = [
                { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'PAQUETE', precioBase: 5000, factorVolumetrico: 2500 },
                { id: 2, origen: 'MEDELLIN', destino: 'BOGOTA', tipoProducto: 'DOCUMENTO', precioBase: 8000, factorVolumetrico: 2500 }
            ];
            mockTarifaRepository.getAllTarifas.mockResolvedValue(tarifas);

            const result = await service.run();
            const data = result.data as any;

            expect(data.tarifas).toHaveLength(1);
            expect(data.tarifas[0].productos).toHaveLength(2);
            expect(data.totalTarifas).toBe(2);
        });

        it('debería incluir la descripción informativa del cálculo logístico', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockTarifaRepository.getAllTarifas.mockResolvedValue([]);

            const result = await service.run();
            const data = result.data as any;

            expect(data.descripcion).toContain('peso facturable');
            expect(data.moneda).toBe('COP');
        });
    });

    describe('Casos de Borde', () => {
        it('debería manejar correctamente una respuesta sin tarifas', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockTarifaRepository.getAllTarifas.mockResolvedValue([]);

            const result = await service.run();

            expect(result.isError).toBe(false);
            expect((result.data as any).tarifas).toHaveLength(0);
        });

        it('debería procesar grandes volúmenes de tarifas sin errores', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const muchasTarifas = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                origen: `ORIGEN_${i}`,
                destino: `DESTINO_${i}`,
                tipoProducto: 'PAQUETE',
                precioBase: 1000,
                factorVolumetrico: 2500
            }));
            mockTarifaRepository.getAllTarifas.mockResolvedValue(muchasTarifas);

            const result = await service.run();
            expect((result.data as any).totalTarifas).toBe(50);
        });
    });
});