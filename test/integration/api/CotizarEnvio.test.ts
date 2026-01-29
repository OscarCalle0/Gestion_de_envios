import 'reflect-metadata';
import { TYPES } from '../../../src/configuration/Types';
import { DEPENDENCY_CONTAINER } from '../../../src/configuration/DependecyContainer';
import { CotizarEnvioAppService } from '../../../src/application/services/CotizarEnvioAppService';

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

        service = new CotizarEnvioAppService(mockTarifaRepository, mockCacheService);
    });

    afterEach(() => {
        DEPENDENCY_CONTAINER.restore();
        jest.clearAllMocks();
    });

    describe('Flujo de Caché (Strategy Pattern)', () => {
        it('debería retornar tarifa desde caché sin consultar BD (Cache HIT)', async () => {
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
        });

        it('debería consultar BD y guardar en caché (Cache MISS)', async () => {
            mockCacheService.get.mockResolvedValue(null);
            const tarifaDb = { precioBase: 5000, factorVolumetrico: 2500 };
            mockTarifaRepository.getTarifa.mockResolvedValue(tarifaDb);

            await service.run({
                tipoProducto: 'PAQUETE',
                origen: 'MEDELLIN',
                destino: 'BOGOTA',
                unidades: [{ pesoReal: 5, alto: 30, ancho: 20, largo: 40 }],
            });

            expect(mockTarifaRepository.getTarifa).toHaveBeenCalled();
            expect(mockCacheService.set).toHaveBeenCalled();
        });
    });

    describe('Lógica de Negocio Logística', () => {
        it('debería calcular el peso facturable usando el mayor entre Real y Volumétrico', async () => {
            mockCacheService.get.mockResolvedValue({ precioBase: 1000, factorVolumetrico: 2500 });

            const result = await service.run({
                tipoProducto: 'PAQUETE',
                origen: 'MEDELLIN',
                destino: 'BOGOTA',
                unidades: [{ pesoReal: 10, alto: 50, ancho: 50, largo: 50 }],
            });

            const data = result.data as any;
            expect(data.unidades[0].pesoFacturable).toBe(50);
            expect(data.valorTotalCotizacion).toBe(50000);
        });

        it('debería redondear dimensiones al entero superior antes del cálculo', async () => {
            mockCacheService.get.mockResolvedValue({ precioBase: 5000, factorVolumetrico: 2500 });

            const result = await service.run({
                tipoProducto: 'PAQUETE',
                origen: 'MEDELLIN',
                destino: 'BOGOTA',
                unidades: [{ pesoReal: 1, alto: 10.1, ancho: 10.2, largo: 10.3 }],
            });

            const unidad = (result.data as any).unidades[0];
            expect(unidad.alto).toBe(11);
            expect(unidad.ancho).toBe(11);
            expect(unidad.largo).toBe(11);
        });
    });

    describe('Gestión de Excepciones', () => {
        it('debería capturar el error cuando no existe tarifa para la ruta', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockTarifaRepository.getTarifa.mockResolvedValue(null);

            try {
                await service.run({
                    tipoProducto: 'PAQUETE',
                    origen: 'CIUDAD_INVENTADA',
                    destino: 'BOGOTA',
                    unidades: [{ pesoReal: 5, alto: 10, ancho: 10, largo: 10 }],
                });
                fail('El servicio debería haber lanzado una excepción');
            } catch (error: any) {
                expect(error.message).toMatch(/No se encontró una tarifa/);
            }
        });
    });
});