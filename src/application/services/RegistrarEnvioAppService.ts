import { injectable, inject } from 'inversify';
import { TYPES } from '../../configuration/Types';
import { EnvioRepository, TarifaRepository } from '@domain/repository/EnvioRepository';
import { EnvioEntity, UnidadEnvio } from '@domain/entities/EnvioEntity';
import { Result, Response } from '@domain/response';
import { BadMessageException } from '@domain/exceptions';

interface RegistrarEnvioInput {
    tipoProducto: 'PAQUETE' | 'DOCUMENTO';
    origen: string;
    destino: string;
    valorDeclarado: number;
    metodoPago: 'FLETE_PAGO' | 'CONTRA_ENTREGA' | 'RECAUDO';
    unidades: UnidadEnvio[];
    remitente: { nombre: string; direccion: string; telefono: string };
    destinatario: { nombre: string; direccion: string; telefono: string; infoAdicional?: string };
    valorCotizacion?: number;
}

@injectable()
export class RegistrarEnvioAppService {
    constructor(
        @inject(TYPES.EnvioRepository) private readonly envioRepository: EnvioRepository,
        @inject(TYPES.TarifaRepository) private readonly tarifaRepository: TarifaRepository
    ) { }

    async run(data: RegistrarEnvioInput): Promise<Response<any>> {
        const tarifa = await this.tarifaRepository.getTarifa(
            data.origen.toUpperCase(),
            data.destino.toUpperCase(),
            data.tipoProducto,
        );

        if (!tarifa) {
            throw new BadMessageException('Ruta no encontrada', 'No se encontró una tarifa para la ruta especificada');
        }

        let valorTotalCotizacion = 0;
        const unidadesProcesadas = data.unidades.map((u: UnidadEnvio) => {
            const unidadCalculada = EnvioEntity.calcularUnidad(u, tarifa.factorVolumetrico);
            valorTotalCotizacion += (unidadCalculada.pesoFacturable || 0) * tarifa.precioBase;
            return unidadCalculada;
        });

        const valorFinal = data.valorCotizacion ?? valorTotalCotizacion;

        const numeroGuia = await this.envioRepository.getNextGuiaNumber();

        const nuevoEnvio = new EnvioEntity({
            id: `ENV-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            numeroGuia,
            tipoProducto: data.tipoProducto,
            origen: data.origen.toUpperCase(),
            destino: data.destino.toUpperCase(),
            valorDeclarado: data.valorDeclarado,
            metodoPago: data.metodoPago,
            unidades: unidadesProcesadas,
            valorTotalCotizacion: valorFinal,
            remitente: data.remitente,
            destinatario: data.destinatario,
        });

        await this.envioRepository.save(nuevoEnvio);

        return Result.ok({
            mensaje: 'Envío registrado exitosamente',
            id: nuevoEnvio.id,
            numeroGuia: nuevoEnvio.numeroGuia,
            estado: nuevoEnvio.estado,
            ruta: `${nuevoEnvio.origen} - ${nuevoEnvio.destino}`,
            tipoProducto: nuevoEnvio.tipoProducto,
            valorTotal: nuevoEnvio.valorTotalCotizacion,
            moneda: nuevoEnvio.moneda,
            unidades: unidadesProcesadas.map((u) => ({
                pesoReal: u.pesoReal,
                dimensiones: `${u.alto}x${u.ancho}x${u.largo} cm`,
                pesoVolumetrico: u.pesoVolumetrico,
                pesoFacturable: u.pesoFacturable,
            })),
        });
    }
}
