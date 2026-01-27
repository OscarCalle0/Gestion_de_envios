import { injectable } from 'inversify';
import { TYPES, DEPENDENCY_CONTAINER } from '@configuration';
import { TarifaRepository } from '@domain/repository/EnvioRepository';
import { EnvioEntity, UnidadEnvio } from '@domain/entities/EnvioEntity';
import { CacheService } from '@infrastructure/cache/RedisCache';
import { Result, Response } from '@domain/response';
import { BadMessageException } from '@domain/exceptions';

const CACHE_TTL_TARIFA = 600;

interface TarifaCache {
    precioBase: number;
    factorVolumetrico: number;
}

@injectable()
export class CotizarEnvioAppService {
    private tarifaRepository = DEPENDENCY_CONTAINER.get<TarifaRepository>(TYPES.TarifaRepository);
    private cacheService = DEPENDENCY_CONTAINER.get<CacheService>(TYPES.CacheService);

    private getTarifaCacheKey(origen: string, destino: string, tipoProducto: string): string {
        return `tarifa:${origen}:${destino}:${tipoProducto}`;
    }

    async run(data: {
        tipoProducto: 'PAQUETE' | 'DOCUMENTO';
        origen: string;
        destino: string;
        unidades: UnidadEnvio[];
    }): Promise<Response<unknown>> {
        const origenUpper = data.origen.toUpperCase();
        const destinoUpper = data.destino.toUpperCase();

        const cacheKey = this.getTarifaCacheKey(origenUpper, destinoUpper, data.tipoProducto);
        let tarifa = await this.cacheService.get<TarifaCache>(cacheKey);

        if (!tarifa) {
            tarifa = await this.tarifaRepository.getTarifa(origenUpper, destinoUpper, data.tipoProducto);

            if (!tarifa) {
                throw new BadMessageException(
                    'Ruta no encontrada',
                    'No se encontró una tarifa para la ruta y tipo de producto especificados',
                );
            }

            await this.cacheService.set(cacheKey, tarifa, CACHE_TTL_TARIFA);
        }

        let valorTotalCotizacion = 0;
        const unidadesProcesadas = data.unidades.map((u) => {
            const unidadCalculada = EnvioEntity.calcularUnidad(u, tarifa!.factorVolumetrico);
            valorTotalCotizacion += (unidadCalculada.pesoFacturable || 0) * tarifa!.precioBase;
            return unidadCalculada;
        });

        return Result.ok({
            tipoProducto: data.tipoProducto,
            ruta: `${origenUpper} - ${destinoUpper}`,
            unidades: unidadesProcesadas,
            valorTotalCotizacion,
            moneda: 'COP',
        });
    }
}
