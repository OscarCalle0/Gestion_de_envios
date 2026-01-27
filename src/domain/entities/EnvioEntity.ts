export interface UnidadEnvio {
    pesoReal: number;
    alto: number;
    ancho: number;
    largo: number;
    pesoVolumetrico?: number;
    pesoFacturable?: number;
}

export interface EnvioProps {
    id: string;
    numeroGuia: string;
    tipoProducto: 'PAQUETE' | 'DOCUMENTO';
    origen: string;
    destino: string;
    valorDeclarado: number;
    metodoPago: 'FLETE_PAGO' | 'CONTRA_ENTREGA' | 'RECAUDO';
    unidades: UnidadEnvio[];
    valorTotalCotizacion: number;
    remitente: { nombre: string; direccion: string; telefono: string };
    destinatario: { nombre: string; direccion: string; telefono: string; infoAdicional?: string };
    estado?: string;
    moneda?: string;
    fechaCreacion?: Date;
    fechaActualizacion?: Date;
}

export type EstadoEnvio = 'En espera' | 'En tránsito' | 'Entregado';

export const ESTADOS_VALIDOS: EstadoEnvio[] = ['En espera', 'En tránsito', 'Entregado'];

export const TRANSICIONES_ESTADO: Record<EstadoEnvio, EstadoEnvio[]> = {
    'En espera': ['En tránsito'],
    'En tránsito': ['Entregado'],
    Entregado: [],
};

export class EnvioEntity {
    public readonly id: string;
    public readonly numeroGuia: string;
    public readonly tipoProducto: 'PAQUETE' | 'DOCUMENTO';
    public readonly origen: string;
    public readonly destino: string;
    public readonly valorDeclarado: number;
    public readonly metodoPago: 'FLETE_PAGO' | 'CONTRA_ENTREGA' | 'RECAUDO';
    public readonly unidades: UnidadEnvio[];
    public readonly valorTotalCotizacion: number;
    public readonly remitente: { nombre: string; direccion: string; telefono: string };
    public readonly destinatario: { nombre: string; direccion: string; telefono: string; infoAdicional?: string };
    public readonly estado: EstadoEnvio;
    public readonly moneda: string;
    public readonly fechaCreacion?: Date;
    public readonly fechaActualizacion?: Date;

    constructor(props: EnvioProps) {
        this.id = props.id;
        this.numeroGuia = props.numeroGuia;
        this.tipoProducto = props.tipoProducto;
        this.origen = props.origen;
        this.destino = props.destino;
        this.valorDeclarado = props.valorDeclarado;
        this.metodoPago = props.metodoPago;
        this.unidades = props.unidades;
        this.valorTotalCotizacion = props.valorTotalCotizacion;
        this.remitente = props.remitente;
        this.destinatario = props.destinatario;
        this.estado = (props.estado as EstadoEnvio) ?? 'En espera';
        this.moneda = props.moneda ?? 'COP';
        this.fechaCreacion = props.fechaCreacion;
        this.fechaActualizacion = props.fechaActualizacion;
    }

    static validarTransicionEstado(estadoActual: EstadoEnvio, nuevoEstado: EstadoEnvio): boolean {
        const transicionesPermitidas = TRANSICIONES_ESTADO[estadoActual];
        return transicionesPermitidas.includes(nuevoEstado);
    }

    static esEstadoValido(estado: string): estado is EstadoEnvio {
        return ESTADOS_VALIDOS.includes(estado as EstadoEnvio);
    }

    static calcularUnidad(unidad: UnidadEnvio, factorVolumetrico: number = 2500): UnidadEnvio {
        const altoRedondeado = Math.ceil(unidad.alto);
        const anchoRedondeado = Math.ceil(unidad.ancho);
        const largoRedondeado = Math.ceil(unidad.largo);

        const pesoVolumetrico = Math.ceil((altoRedondeado * anchoRedondeado * largoRedondeado) / factorVolumetrico);
        const pesoFacturable = Math.max(unidad.pesoReal, pesoVolumetrico);

        return {
            ...unidad,
            alto: altoRedondeado,
            ancho: anchoRedondeado,
            largo: largoRedondeado,
            pesoVolumetrico,
            pesoFacturable,
        };
    }
}
