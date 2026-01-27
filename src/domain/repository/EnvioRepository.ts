import { EnvioEntity } from '@domain/entities/EnvioEntity';

export interface Tarifa {
    id: number;
    origen: string;
    destino: string;
    tipoProducto: string;
    precioBase: number;
    factorVolumetrico: number;
    activo: boolean;
}

export interface HistorialEstado {
    id: number;
    envioId: string;
    estadoAnterior: string | null;
    estadoNuevo: string;
    ubicacion: string | null;
    observacion: string | null;
    fechaCambio: Date;
}

export interface TarifaRepository {
    getTarifa(
        origen: string,
        destino: string,
        tipoProducto: string,
    ): Promise<{ precioBase: number; factorVolumetrico: number } | null>;
    getAllTarifas(): Promise<Tarifa[]>;
}

export interface EnvioRepository {
    save(envio: EnvioEntity): Promise<void>;
    findByGuia(numeroGuia: string): Promise<EnvioEntity | null>;
    updateEstado(
        numeroGuia: string,
        nuevoEstado: string,
        ubicacion?: string,
        observacion?: string,
    ): Promise<EnvioEntity | null>;
    getHistorial(envioId: string): Promise<HistorialEstado[]>;
    getNextGuiaNumber(): Promise<string>;
}
