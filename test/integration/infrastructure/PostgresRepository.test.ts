import 'reflect-metadata';
import { TYPES } from '../../../src/configuration/Types';
import { DEPENDENCY_CONTAINER } from '../../../src/configuration/DependecyContainer';
import { PostgresEnvioRepository } from '../../../src/infrastructure/repositories/PostgresRepository';
import { EnvioEntity } from '../../../src/domain/entities/EnvioEntity';

describe('PostgresEnvioRepository Deep Coverage', () => {
    let repo: PostgresEnvioRepository;
    let mockDb: any;

    beforeAll(async () => {
        mockDb = {
            query: jest.fn(),
            one: jest.fn(),
            oneOrNone: jest.fn(),
            manyOrNone: jest.fn(),
            tx: jest.fn((callback) => callback(mockDb)),
            connect: jest.fn().mockResolvedValue({}),
            $disconnect: jest.fn().mockResolvedValue({})
        };

        if (DEPENDENCY_CONTAINER.isBound(TYPES.PostgresDatabase)) {
            DEPENDENCY_CONTAINER.unbind(TYPES.PostgresDatabase);
        }
        DEPENDENCY_CONTAINER.bind(TYPES.PostgresDatabase).toConstantValue(mockDb);

        repo = new PostgresEnvioRepository();
    });

    it('debería obtener todas las tarifas activas (getAllTarifas)', async () => {
        mockDb.manyOrNone.mockResolvedValue([
            { id: 1, origen: 'MEDELLIN', destino: 'BOGOTA', tipo_producto: 'PAQUETE' }
        ]);

        const tarifas = await repo.getAllTarifas();
        expect(Array.isArray(tarifas)).toBe(true);
        expect(mockDb.manyOrNone).toHaveBeenCalled();
    });

    it('debería obtener una tarifa específica (getTarifa)', async () => {
        mockDb.oneOrNone.mockResolvedValue({
            precio_base: 5000,
            factor_volumetrico: 2500
        });

        const tarifa = await repo.getTarifa('MEDELLIN', 'BOGOTA', 'PAQUETE');

        expect(tarifa).toHaveProperty('precioBase');
    });

    it('debería actualizar el estado y registrar en historial', async () => {
        mockDb.one.mockResolvedValue({ nextval: '27012600001' });
        mockDb.oneOrNone.mockResolvedValue({ id: '123', numero_guia: '27012600001', estado: 'En tránsito' });

        const guia = await repo.getNextGuiaNumber();
        const nuevoEnvio = new EnvioEntity({
            id: `test-${Date.now()}`,
            numeroGuia: guia,
            tipoProducto: 'PAQUETE',
            origen: 'MEDELLIN',
            destino: 'BOGOTA',
            valorDeclarado: 10000,
            metodoPago: 'FLETE_PAGO',
            unidades: [],
            valorTotalCotizacion: 5000,
            remitente: { nombre: 'R', direccion: 'D', telefono: 'T' },
            destinatario: { nombre: 'D', direccion: 'D', telefono: 'T' },
            estado: 'En espera'
        });

        await repo.save(nuevoEnvio);
        const actualizado = await repo.updateEstado(guia, 'En tránsito');

        expect(actualizado?.estado).toBe('En tránsito');
    });
});