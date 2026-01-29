import { injectable, inject } from 'inversify';
import { TYPES } from '../../configuration/Types';
import { TarifaRepository, Tarifa } from '@domain/repository/EnvioRepository';
import { CacheService } from '@infrastructure/cache/RedisCache';
import { Result, Response } from '@domain/response';

const CACHE_KEY_TARIFAS = 'tarifas:all';
const CACHE_TTL_TARIFAS = 600;

@injectable()
export class ConsultarTarifasAppService {
    constructor(
        @inject(TYPES.TarifaRepository) private readonly tarifaRepository: TarifaRepository,
        @inject(TYPES.CacheService) private readonly cacheService: CacheService
    ) { }

    async run(): Promise<Response<unknown>> {
        const cachedTarifas = await this.cacheService.get<Tarifa[]>(CACHE_KEY_TARIFAS);

        let tarifas: Tarifa[];

        if (cachedTarifas) {
            tarifas = cachedTarifas;
        } else {
            tarifas = await this.tarifaRepository.getAllTarifas();

            await this.cacheService.set(CACHE_KEY_TARIFAS, tarifas, CACHE_TTL_TARIFAS);
        }

        const tarifasAgrupadas = tarifas.reduce(
            (acc: Record<string, { origen: string; destino: string; productos: unknown[] }>, tarifa) => {
                const ruta = `${tarifa.origen} - ${tarifa.destino}`;
                if (!acc[ruta]) {
                    acc[ruta] = {
                        origen: tarifa.origen,
                        destino: tarifa.destino,
                        productos: [],
                    };
                }
                acc[ruta].productos.push({
                    tipoProducto: tarifa.tipoProducto,
                    precioBase: tarifa.precioBase,
                    factorVolumetrico: tarifa.factorVolumetrico,
                });
                return acc;
            },
            {},
        );

        return Result.ok({
            totalTarifas: tarifas.length,
            moneda: 'COP',
            descripcion:
                'Tarifas por kilogramo facturable. El peso facturable es el mayor entre el peso real y el peso volumétrico (alto*ancho*largo/factor_volumetrico)',
            fromCache: cachedTarifas !== null,
            tarifas: Object.values(tarifasAgrupadas),
            tarifasDetalle: tarifas.map((t) => ({
                id: t.id,
                origen: t.origen,
                destino: t.destino,
                tipoProducto: t.tipoProducto,
                precioBase: t.precioBase,
                factorVolumetrico: t.factorVolumetrico,
            })),
        });
    }
}
