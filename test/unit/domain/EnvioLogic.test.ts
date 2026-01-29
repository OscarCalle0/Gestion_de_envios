import { EnvioEntity, ESTADOS_VALIDOS, TRANSICIONES_ESTADO } from "../../../src/domain/entities/EnvioEntity";

describe('EnvioEntity Logic', () => {
    describe('Cálculo de Unidades', () => {
        it('debe redondear las dimensiones al entero superior', () => {
            const unidad = {
                pesoReal: 10,
                alto: 10.2,
                ancho: 20.5,
                largo: 30.1
            };
            const calculada = EnvioEntity.calcularUnidad(unidad, 2500);
            
            expect(calculada.alto).toBe(11);
            expect(calculada.ancho).toBe(21);
            expect(calculada.largo).toBe(31);
        });

        it('debe calcular correctamente el peso volumétrico (11*21*31/2500 = 2.86 -> 3)', () => {
            const unidad = {
                pesoReal: 2,
                alto: 11,
                ancho: 21,
                largo: 31
            };
            const calculada = EnvioEntity.calcularUnidad(unidad, 2500);
            expect(calculada.pesoVolumetrico).toBe(3);
            expect(calculada.pesoFacturable).toBe(3);
        });

        it('debe usar el peso real cuando es mayor que el volumétrico', () => {
            const unidad = {
                pesoReal: 10,
                alto: 10,
                ancho: 10,
                largo: 10
            };
            const calculada = EnvioEntity.calcularUnidad(unidad, 2500);
            expect(calculada.pesoVolumetrico).toBe(1);
            expect(calculada.pesoFacturable).toBe(10); 
        });
    });

    describe('Validación de Estados', () => {
        it('debe validar estados correctos', () => {
            expect(EnvioEntity.esEstadoValido('En espera')).toBe(true);
            expect(EnvioEntity.esEstadoValido('En tránsito')).toBe(true);
            expect(EnvioEntity.esEstadoValido('Entregado')).toBe(true);
        });

        it('debe rechazar estados inválidos', () => {
            expect(EnvioEntity.esEstadoValido('Cancelado')).toBe(false);
            expect(EnvioEntity.esEstadoValido('Pendiente')).toBe(false);
        });

        it('debe validar transiciones de estado permitidas', () => {
            expect(EnvioEntity.validarTransicionEstado('En espera', 'En tránsito')).toBe(true);
            expect(EnvioEntity.validarTransicionEstado('En tránsito', 'Entregado')).toBe(true);
        });

        it('debe rechazar transiciones de estado no permitidas', () => {
            expect(EnvioEntity.validarTransicionEstado('En espera', 'Entregado')).toBe(false);
            expect(EnvioEntity.validarTransicionEstado('Entregado', 'En espera')).toBe(false);
            expect(EnvioEntity.validarTransicionEstado('En tránsito', 'En espera')).toBe(false);
        });
    });

    describe('Constantes de Estados', () => {
        it('debe tener 3 estados válidos', () => {
            expect(ESTADOS_VALIDOS.length).toBe(3);
            expect(ESTADOS_VALIDOS).toContain('En espera');
            expect(ESTADOS_VALIDOS).toContain('En tránsito');
            expect(ESTADOS_VALIDOS).toContain('Entregado');
        });

        it('debe tener transiciones definidas para cada estado', () => {
            expect(TRANSICIONES_ESTADO['En espera']).toEqual(['En tránsito']);
            expect(TRANSICIONES_ESTADO['En tránsito']).toEqual(['Entregado']);
            expect(TRANSICIONES_ESTADO['Entregado']).toEqual([]);
        });
    });

    describe('Creación de EnvioEntity', () => {
        it('debe crear un envío con estado inicial "En espera"', () => {
            const envio = new EnvioEntity({
                id: 'test-id',
                numeroGuia: '23012600001',
                tipoProducto: 'PAQUETE',
                origen: 'MEDELLIN',
                destino: 'BOGOTA',
                valorDeclarado: 100000,
                metodoPago: 'FLETE_PAGO',
                unidades: [],
                valorTotalCotizacion: 25000,
                remitente: { nombre: 'Test', direccion: 'Dir', telefono: '123' },
                destinatario: { nombre: 'Test2', direccion: 'Dir2', telefono: '456' }
            });

            expect(envio.estado).toBe('En espera');
            expect(envio.moneda).toBe('COP');
        });
    });
});
