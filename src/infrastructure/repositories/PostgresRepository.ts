import { injectable } from 'inversify';
import { DEPENDENCY_CONTAINER, TYPES } from '@configuration';
import { EnvioRepository, TarifaRepository, Tarifa, HistorialEstado } from '@domain/repository/EnvioRepository';
import { EnvioEntity, UnidadEnvio, EstadoEnvio } from '@domain/entities/EnvioEntity';

@injectable()
export class PostgresEnvioRepository implements EnvioRepository, TarifaRepository {
    // CORRECCIÓN S2933: Añadido readonly
    private readonly db = DEPENDENCY_CONTAINER.get<any>(TYPES.PostgresDatabase);

    async save(envio: EnvioEntity): Promise<void> {
        await this.db.tx(async (t: any) => {
            await t.none(
                `INSERT INTO envios(id, numero_guia, tipo_producto, origen, destino, valor_declarado, metodo_pago, valor_total_cotizacion, estado, remitente_nombre, remitente_direccion, remitente_telefono, destinatario_nombre, destinatario_direccion, destinatario_telefono, destinatario_info_adicional) 
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
                [
                    envio.id,
                    envio.numeroGuia,
                    envio.tipoProducto,
                    envio.origen,
                    envio.destino,
                    envio.valorDeclarado,
                    envio.metodoPago,
                    envio.valorTotalCotizacion,
                    envio.estado,
                    envio.remitente.nombre,
                    envio.remitente.direccion,
                    envio.remitente.telefono,
                    envio.destinatario.nombre,
                    envio.destinatario.direccion,
                    envio.destinatario.telefono,
                    envio.destinatario.infoAdicional || null,
                ],
            );

            for (const unidad of envio.unidades) {
                await t.none(
                    'INSERT INTO envio_unidades(envio_id, peso_real, alto, ancho, largo, peso_volumetrico, peso_facturable) VALUES($1, $2, $3, $4, $5, $6, $7)',
                    [
                        envio.id,
                        unidad.pesoReal,
                        unidad.alto,
                        unidad.ancho,
                        unidad.largo,
                        unidad.pesoVolumetrico,
                        unidad.pesoFacturable,
                    ],
                );
            }

            await t.none(
                'INSERT INTO envio_historial(envio_id, estado_anterior, estado_nuevo, observacion) VALUES($1, $2, $3, $4)',
                [envio.id, null, envio.estado, 'Envío registrado en el sistema'],
            );
        });
    }

    async findByGuia(numeroGuia: string): Promise<EnvioEntity | null> {
        const envioData = await this.db.oneOrNone(
            `SELECT id, numero_guia as "numeroGuia", tipo_producto as "tipoProducto", origen, destino, 
                    valor_declarado as "valorDeclarado", moneda, metodo_pago as "metodoPago", 
                    valor_total_cotizacion as "valorTotalCotizacion", estado,
                    remitente_nombre, remitente_direccion, remitente_telefono,
                    destinatario_nombre, destinatario_direccion, destinatario_telefono, destinatario_info_adicional,
                    fecha_creacion as "fechaCreacion", fecha_actualizacion as "fechaActualizacion"
             FROM envios WHERE numero_guia = $1`,
            [numeroGuia],
        );

        if (!envioData) return null;

        const unidades = await this.db.manyOrNone(
            `SELECT peso_real as "pesoReal", alto, ancho, largo, 
                    peso_volumetrico as "pesoVolumetrico", peso_facturable as "pesoFacturable"
             FROM envio_unidades WHERE envio_id = $1`,
            [envioData.id],
        );

        return new EnvioEntity({
            id: envioData.id,
            numeroGuia: envioData.numeroGuia,
            tipoProducto: envioData.tipoProducto,
            origen: envioData.origen,
            destino: envioData.destino,
            // CORRECCIÓN S7773: Number.parseFloat
            valorDeclarado: Number.parseFloat(envioData.valorDeclarado),
            metodoPago: envioData.metodoPago,
            unidades: unidades as UnidadEnvio[],
            // CORRECCIÓN S7773: Number.parseFloat
            valorTotalCotizacion: Number.parseFloat(envioData.valorTotalCotizacion),
            remitente: {
                nombre: envioData.remitente_nombre,
                direccion: envioData.remitente_direccion,
                telefono: envioData.remitente_telefono,
            },
            destinatario: {
                nombre: envioData.destinatario_nombre,
                direccion: envioData.destinatario_direccion,
                telefono: envioData.destinatario_telefono,
                infoAdicional: envioData.destinatario_info_adicional,
            },
            estado: envioData.estado,
            moneda: envioData.moneda,
            fechaCreacion: envioData.fechaCreacion,
            fechaActualizacion: envioData.fechaActualizacion,
        });
    }

    // ... (El resto de métodos quedan igual pero se benefician del readonly de 'db')
    async updateEstado(
        numeroGuia: string,
        nuevoEstado: EstadoEnvio,
        ubicacion?: string,
        observacion?: string,
    ): Promise<EnvioEntity | null> {
        const envioActual = await this.findByGuia(numeroGuia);
        if (!envioActual) return null;

        await this.db.tx(async (t: any) => {
            await t.none(
                `UPDATE envios SET estado = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE numero_guia = $2`,
                [nuevoEstado, numeroGuia],
            );

            await t.none(
                'INSERT INTO envio_historial(envio_id, estado_anterior, estado_nuevo, ubicacion, observacion) VALUES($1, $2, $3, $4, $5)',
                [envioActual.id, envioActual.estado, nuevoEstado, ubicacion || null, observacion || null],
            );
        });

        return this.findByGuia(numeroGuia);
    }

    async getHistorial(envioId: string): Promise<HistorialEstado[]> {
        const historial = await this.db.manyOrNone(
            `SELECT id, envio_id as "envioId", estado_anterior as "estadoAnterior", 
                    estado_nuevo as "estadoNuevo", ubicacion, observacion, 
                    fecha_cambio as "fechaCambio"
             FROM envio_historial WHERE envio_id = $1 ORDER BY fecha_cambio ASC`,
            [envioId],
        );
        return historial || [];
    }

    async getNextGuiaNumber(): Promise<string> {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const fechaClave = `${day}${month}${year}`;

        const result = await this.db.one(
            `INSERT INTO guia_secuencia (fecha_clave, ultimo_consecutivo) 
             VALUES ($1, 1) 
             ON CONFLICT (fecha_clave) 
             DO UPDATE SET ultimo_consecutivo = guia_secuencia.ultimo_consecutivo + 1 
             RETURNING ultimo_consecutivo`,
            [fechaClave],
        );

        const consecutivo = String(result.ultimo_consecutivo).padStart(5, '0');
        return `${fechaClave}${consecutivo}`;
    }

    async getTarifa(
        origen: string,
        destino: string,
        tipoProducto: string,
    ): Promise<{ precioBase: number; factorVolumetrico: number } | null> {
        return this.db.oneOrNone(
            `SELECT precio_base as "precioBase", factor_volumetrico as "factorVolumetrico" 
             FROM tarifas 
             WHERE origen = $1 AND destino = $2 AND (tipo_producto = $3 OR tipo_producto = 'AMBOS') AND activo = TRUE`,
            [origen, destino, tipoProducto],
        );
    }

    async getAllTarifas(): Promise<Tarifa[]> {
        const tarifas = await this.db.manyOrNone(
            `SELECT id, origen, destino, tipo_producto as "tipoProducto", 
                    precio_base as "precioBase", factor_volumetrico as "factorVolumetrico", activo
             FROM tarifas WHERE activo = TRUE ORDER BY origen, destino`,
        );
        return tarifas || [];
    }
}