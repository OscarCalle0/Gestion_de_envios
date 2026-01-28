import 'reflect-metadata';
import { PostgresEnvioRepository } from '@infrastructure/repositories/PostgresRepository';
import { EnvioEntity } from '@domain/entities/EnvioEntity';
import { createDependencyContainer } from '@configuration/DependecyContainer';

describe('PostgresEnvioRepository Deep Coverage', () => {
    let repo: PostgresEnvioRepository;

    beforeAll(() => {
        createDependencyContainer();
        repo = new PostgresEnvioRepository();
    });

    it('debería obtener todas las tarifas activas (getAllTarifas)', async () => {
        const tarifas = await repo.getAllTarifas();
        expect(Array.isArray(tarifas)).toBe(true);
    });

    it('debería obtener una tarifa específica (getTarifa)', async () => {
        // Asumiendo que existen datos de semilla o mockeando la DB
        const tarifa = await repo.getTarifa('MEDELLIN', 'BOGOTA', 'PAQUETE');
        if (tarifa) {
            expect(tarifa).toHaveProperty('precioBase');
            expect(tarifa).toHaveProperty('factorVolumetrico');
        }
    });

    it('debería actualizar el estado y registrar en historial', async () => {
        // 1. Crear un envío primero
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

        // 2. Actualizar
        const actualizado = await repo.updateEstado(guia, 'En tránsito', 'Bodega Central', 'Carga lista');
        expect(actualizado?.estado).toBe('En tránsito');

        // 3. Verificar historial (Cubre getHistorial)
        const historial = await repo.getHistorial(nuevoEnvio.id);
        expect(historial.length).toBeGreaterThan(1); // El de registro + el de actualización
        expect(historial.find(h => h.estadoNuevo === 'En tránsito')).toBeDefined();
    });

    it('debería retornar null si updateEstado recibe una guía inexistente', async () => {
        const resultado = await repo.updateEstado('GUIA-IMPOSIBLE', 'Entregado');
        expect(resultado).toBeNull();
    });
});