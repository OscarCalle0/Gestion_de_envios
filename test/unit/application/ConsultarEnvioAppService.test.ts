import 'reflect-metadata';
import { ConsultarEnvioAppService } from '@application/services/ConsultarEnvioAppService';

describe('ConsultarEnvioAppService', () => {
    let service: ConsultarEnvioAppService;
    let mockRepo: any;
    let mockCache: any;

    beforeEach(() => {
        mockRepo = {
            findByGuia: jest.fn(),
            getHistorial: jest.fn()
        };
        mockCache = {
            get: jest.fn(),
            set: jest.fn()
        };

        service = new ConsultarEnvioAppService(mockRepo, mockCache);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('debería lanzar una excepción si la guía no existe en DB', async () => {
        mockCache.get.mockResolvedValue(null);
        mockRepo.findByGuia.mockResolvedValue(null);

        try {
            await service.run('GUIA_TEST');
            throw new Error('Debería haber lanzado una excepción');
        } catch (error: any) {
            expect(error.message).toContain('No se encontró ningún envío con la guía: GUIA_TEST');
            expect(mockRepo.findByGuia).toHaveBeenCalledWith('GUIA_TEST');
        }
    });

    it('debería retornar datos desde el caché (HIT)', async () => {
        const fakeData = {
            envio: {
                numeroGuia: '123',
                id: '1',
                unidades: [],
                remitente: { nombre: 'N', direccion: 'D', telefono: 'T' },
                destinatario: { nombre: 'N', direccion: 'D', telefono: 'T' },
                valorTotalCotizacion: 0
            },
            historial: []
        };
        mockCache.get.mockResolvedValue(fakeData);

        const result = await service.run('123');

        expect(result.data).toMatchObject({ fromCache: true });
        expect(mockRepo.findByGuia).not.toHaveBeenCalled();
    });
});