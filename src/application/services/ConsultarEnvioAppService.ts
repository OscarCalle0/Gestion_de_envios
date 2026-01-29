import { injectable, inject } from 'inversify';
import { TYPES } from '../../configuration/Types';
import { EnvioRepository } from '@domain/repository/EnvioRepository';
import { EnvioEntity } from '@domain/entities/EnvioEntity';
import { CacheService } from '@infrastructure/cache/RedisCache';
import { Result, Response } from '@domain/response';
import { BadMessageException } from '@domain/exceptions';

const CACHE_TTL_ENVIO = 60;

interface EnvioCache {
    envio: EnvioEntity;
    historial: unknown[];
}

@injectable()
export class ConsultarEnvioAppService {
    constructor(
        @inject(TYPES.EnvioRepository) private readonly envioRepository: EnvioRepository,
        @inject(TYPES.CacheService) private readonly cacheService: CacheService
    ) {}

    private getCacheKey(numeroGuia: string): string {
        return `envio:${numeroGuia}`;
    }

    async run(numeroGuia: string): Promise<Response<unknown>> {
        const cacheKey = this.getCacheKey(numeroGuia);
        const cached = await this.cacheService.get<EnvioCache>(cacheKey);

        let envio: EnvioEntity | null = null;
        let historial: unknown[] = [];
        let fromCache = false;

        if (cached) {
            envio = new EnvioEntity(cached.envio);
            historial = cached.historial;
            fromCache = true;
        } else {
            envio = await this.envioRepository.findByGuia(numeroGuia);

            if (!envio) {
                throw new BadMessageException(
                    'Guía no encontrada',
                    `No se encontró ningún envío con la guía: ${numeroGuia}`,
                );
            }

            historial = await this.envioRepository.getHistorial(envio.id);
            await this.cacheService.set(cacheKey, { envio, historial }, CACHE_TTL_ENVIO);
        }

        return Result.ok({
            numeroGuia: envio.numeroGuia,
            estado: envio.estado,
            tipoProducto: envio.tipoProducto,
            ruta: { origen: envio.origen, destino: envio.destino },
            remitente: { ...envio.remitente },
            destinatario: { ...envio.destinatario },
            valorTotal: envio.valorTotalCotizacion,
            moneda: envio.moneda,
            metodoPago: envio.metodoPago,
            unidades: envio.unidades.map((u) => ({
                pesoReal: u.pesoReal,
                dimensiones: `${u.alto}x${u.ancho}x${u.largo} cm`,
                pesoVolumetrico: u.pesoVolumetrico,
                pesoFacturable: u.pesoFacturable,
            })),
            historialEstados: historial,
            fromCache,
            fechaCreacion: envio.fechaCreacion,
            fechaActualizacion: envio.fechaActualizacion,
        });
    }
}