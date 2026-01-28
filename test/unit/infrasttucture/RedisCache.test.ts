import { RedisCacheService } from '../../../src/infrastructure/cache/RedisCache';

// 1. Definimos la instancia del mock fuera de todo
const redisMockInstance = {
    on: jest.fn().mockImplementation(function(this: any, event, cb) {
        if (event === 'connect') cb();
        return this;
    }),
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    quit: jest.fn().mockResolvedValue('OK'),
    status: 'ready'
};

// 2. FORZAMOS el mock de ioredis antes de que se use
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => redisMockInstance);
});

describe('RedisCacheService', () => {
    let service: RedisCacheService;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Spies para que no ensucien la consola y cuenten cobertura
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});

        // RE-INYECCIÓN MANUAL: Nos aseguramos de que el servicio use el mock
        service = new RedisCacheService();
        (service as any).client = redisMockInstance;
        (service as any).connected = true; 
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('debería estar conectado', () => {
        expect(service.isConnected()).toBe(true);
    });

    it('debería retornar datos desde el caché (HIT)', async () => {
        const mockData = { id: 1 };
        redisMockInstance.get.mockResolvedValue(JSON.stringify(mockData));

        const result = await service.get('key_existente');

        expect(result).toEqual(mockData);
        expect(redisMockInstance.get).toHaveBeenCalledWith('key_existente');
    });

    it('debería retornar null en get si no hay datos (MISS)', async () => {
        redisMockInstance.get.mockResolvedValue(null);
        const result = await service.get('key_no_existe');
        expect(result).toBeNull();
    });

    it('debería manejar errores en GET y retornar null', async () => {
        redisMockInstance.get.mockRejectedValue(new Error('Read Error'));
        const result = await service.get('any_key');
        expect(result).toBeNull();
        expect(console.warn).toHaveBeenCalled();
    });

    it('debería guardar datos con setex (SET)', async () => {
        const data = { foo: 'bar' };
        redisMockInstance.setex.mockResolvedValue('OK');

        await service.set('my_key', data, 60);

        expect(redisMockInstance.setex).toHaveBeenCalledWith('my_key', 60, JSON.stringify(data));
    });

    it('debería borrar por patrón (delPattern)', async () => {
        redisMockInstance.keys.mockResolvedValue(['k1', 'k2']);
        redisMockInstance.del.mockResolvedValue(2);

        await service.delPattern('test_*');

        expect(redisMockInstance.keys).toHaveBeenCalledWith('test_*');
        expect(redisMockInstance.del).toHaveBeenCalledWith('k1', 'k2');
    });

    it('no debería intentar borrar si no hay llaves en delPattern', async () => {
        redisMockInstance.keys.mockResolvedValue([]);
        await service.delPattern('empty_*');
        expect(redisMockInstance.del).not.toHaveBeenCalled();
    });

    it('debería cubrir el catch del constructor', () => {
        // Este test es específico para la línea 60 del archivo original
        const ioredis = require('ioredis');
        ioredis.mockImplementationOnce(() => { throw new Error('Fail'); });
        
        const failService = new RedisCacheService();
        expect(failService.isConnected()).toBe(false);
    });
});