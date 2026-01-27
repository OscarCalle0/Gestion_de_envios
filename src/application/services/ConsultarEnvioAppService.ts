import { injectable } from 'inversify';
import { TYPES, DEPENDENCY_CONTAINER } from '@configuration';
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
    private envioRepository = DEPENDENCY_CONTAINER.get<EnvioRepository>(TYPES.EnvioRepository);
    private cacheService = DEPENDENCY_CONTAINER.get<CacheService>(TYPES.CacheService);

    private getCacheKey(numeroGuia: string): string {
        return `envio:${numeroGuia}`;
    }

    async run(numeroGuia: string): Promise<Response<unknown>> {
        const cacheKey = this.getCacheKey(numeroGuia);
        const cached = await this.cacheService.get<EnvioCache>(cacheKey);

        let envio: EnvioEntity | null;
        let historial: unknown[];
        let fromCache = false;

        if (cached) {
            envio = new EnvioEntity(cached.envio as EnvioEntity);
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

        if (!envio) {
            throw new BadMessageException(
                'Guía no encontrada',
                `No se encontró ningún envío con la guía: ${numeroGuia}`,
            );
        }

        return Result.ok({
            numeroGuia: envio.numeroGuia,
            estado: envio.estado,
            tipoProducto: envio.tipoProducto,
            ruta: {
                origen: envio.origen,
                destino: envio.destino,
            },
            remitente: {
                nombre: envio.remitente.nombre,
                direccion: envio.remitente.direccion,
                telefono: envio.remitente.telefono,
            },
            destinatario: {
                nombre: envio.destinatario.nombre,
                direccion: envio.destinatario.direccion,
                telefono: envio.destinatario.telefono,
                infoAdicional: envio.destinatario.infoAdicional,
            },
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
