import { injectable, inject } from 'inversify';
import { TYPES } from '../../configuration/Types';
import { EnvioRepository } from '@domain/repository/EnvioRepository';
import { EnvioEntity, EstadoEnvio, ESTADOS_VALIDOS } from '@domain/entities/EnvioEntity';
import { CacheService } from '@infrastructure/cache/RedisCache';
import { Result, Response } from '@domain/response';
import { BadMessageException } from '@domain/exceptions';

interface ActualizarEstadoInput {
    estado: EstadoEnvio;
    ubicacion?: string;
    observacion?: string;
}

@injectable()
export class ActualizarEstadoAppService {
    constructor(
        @inject(TYPES.EnvioRepository) private readonly envioRepository: EnvioRepository,
        @inject(TYPES.CacheService) private readonly cacheService: CacheService
    ) { }
    private getCacheKey(numeroGuia: string): string {
        return `envio:${numeroGuia}`;
    }

    async run(numeroGuia: string, data: ActualizarEstadoInput): Promise<Response<unknown>> {
        if (!EnvioEntity.esEstadoValido(data.estado)) {
            throw new BadMessageException(
                'Estado inválido',
                `El estado "${data.estado}" no es válido. Estados permitidos: ${ESTADOS_VALIDOS.join(', ')}`,
            );
        }

        const envioActual = await this.envioRepository.findByGuia(numeroGuia);
        if (!envioActual) {
            throw new BadMessageException(
                'Guía no encontrada',
                `No se encontró ningún envío con la guía: ${numeroGuia}`,
            );
        }

        if (!EnvioEntity.validarTransicionEstado(envioActual.estado, data.estado)) {
            throw new BadMessageException(
                'Transición de estado no permitida',
                `No se puede cambiar de "${envioActual.estado}" a "${data.estado}". La secuencia válida es: En espera → En tránsito → Entregado`,
            );
        }

        const envioActualizado = await this.envioRepository.updateEstado(
            numeroGuia,
            data.estado,
            data.ubicacion,
            data.observacion,
        );

        if (!envioActualizado) {
            throw new BadMessageException('Error de actualización', 'No se pudo actualizar el estado del envío');
        }

        await this.cacheService.del(this.getCacheKey(numeroGuia));

        const historial = await this.envioRepository.getHistorial(envioActualizado.id);

        return Result.ok({
            numeroGuia: envioActualizado.numeroGuia,
            estadoAnterior: envioActual.estado,
            estadoActual: envioActualizado.estado,
            mensaje: `Estado actualizado correctamente de "${envioActual.estado}" a "${envioActualizado.estado}"`,
            historialEstados: historial.map((h) => ({
                estadoAnterior: h.estadoAnterior,
                estadoNuevo: h.estadoNuevo,
                ubicacion: h.ubicacion,
                observacion: h.observacion,
                fecha: h.fechaCambio,
            })),
            fechaActualizacion: envioActualizado.fechaActualizacion,
        });
    }
}
