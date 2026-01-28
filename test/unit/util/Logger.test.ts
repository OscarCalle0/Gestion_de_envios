import { logger } from '../../../src/util/Logger';

describe('Logger Utility', () => {
    it('debería registrar logs de diferentes niveles sin fallar', () => {
        // Espiamos los métodos de console
        const infoSpy = jest.spyOn(console, 'log').mockImplementation();
        const errorSpy = jest.spyOn(console, 'error').mockImplementation();
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

        // Creamos un error de prueba
        const testError = new Error('Fail');

        // Ejecutamos los métodos del logger
        logger.info('Test info');
        // Corregimos el error de TS pasando un objeto en lugar del Error directamente
        logger.error('Test error', { error: testError.message, stack: testError.stack });
        logger.warn('Test warn');

        // Verificamos que se hayan llamado
        expect(infoSpy).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalled();

        // Limpiamos los mocks
        infoSpy.mockRestore();
        errorSpy.mockRestore();
        warnSpy.mockRestore();
    });
});