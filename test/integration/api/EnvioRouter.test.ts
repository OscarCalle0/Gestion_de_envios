import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { createDependencyContainer } from '../../../src/configuration/DependecyContainer'; 
import { application } from '../../../src/infrastructure/api/Application';

describe('EnvioRouter Integration', () => {
    const FULL_PREFIX = '/coordinadora/gestion-envios';

    beforeAll(async () => {
        createDependencyContainer();
        await application.ready();
    });

    afterAll(async () => {
        await application.close();
    });

    it('GET /health - Debería retornar 200 OK', async () => {
        const response = await application.inject({
            method: 'GET',
            url: `/health`
        });
        expect(response.statusCode).toBe(200);
    });

    it('GET /tarifas - Debería retornar la lista de tarifas', async () => {
        const response = await application.inject({
            method: 'GET',
            url: `${FULL_PREFIX}/tarifas`
        });
        expect(response.statusCode).toBe(200);
    });

    it('POST /envios - Debería crear un envío exitosamente (201)', async () => {
        const payload = {
            tipoProducto: "PAQUETE",
            origen: "MEDELLIN",
            destino: "BOGOTA",
            valorDeclarado: 50000,
            metodoPago: "CONTRA_ENTREGA",
            remitente: {
                nombre: "Empresa ABC",
                direccion: "Carrera 10 #20-30",
                telefono: "6012223344"
            },
            destinatario: {
                nombre: "Juan Perez",
                direccion: "Calle 123 #45-67",
                telefono: "3001112233"
            },
            unidades: [{
                pesoReal: 10,
                alto: 20,
                ancho: 20,
                largo: 20
            }]
        };

        const response = await application.inject({
            method: 'POST',
            url: `${FULL_PREFIX}/envios`,
            payload: payload
        });
        expect(response.statusCode).toBe(201);
    });

    it('POST /cotizar - Error de validación (Cubre líneas 32-35)', async () => {
        const response = await application.inject({
            method: 'POST',
            url: `${FULL_PREFIX}/cotizar`,
            payload: { origen: "MEDELLIN" } 
        });
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body.isError).toBe(true);
    });

    it('POST /envios - Error de validación (Cubre líneas 47-50)', async () => {
        const response = await application.inject({
            method: 'POST',
            url: `${FULL_PREFIX}/envios`,
            payload: { tipoProducto: "INVALIDO" }
        });
        expect(response.statusCode).toBe(400);
    });

    it('GET /envios/:guia - Guía con formato inválido (Cubre líneas 62-65)', async () => {
        const response = await application.inject({
            method: 'GET',
            url: `${FULL_PREFIX}/envios/ABC` 
        });
        expect(response.statusCode).toBe(400);
    });

    it('PATCH /envios/:guia/estado - Parámetro Guía inválido (Cubre líneas 77-80)', async () => {
        const response = await application.inject({
            method: 'PATCH',
            url: `${FULL_PREFIX}/envios/123/estado`, 
            payload: { estado: "En tránsito" }
        });
        expect(response.statusCode).toBe(400);
    });

    it('PATCH /envios/:guia/estado - Body de estado inválido (Cubre líneas 87-90)', async () => {
        const response = await application.inject({
            method: 'PATCH',
            url: `${FULL_PREFIX}/envios/23012600001/estado`, 
            payload: { estado: "ESTADO_QUE_NO_EXISTE" } 
        });
        expect(response.statusCode).toBe(400);
    });
});