import { logger } from '../../../src/util/Logger';

describe('Logger Utility', () => {
    it('debería registrar logs de diferentes niveles sin fallar', () => {
        const infoSpy = jest.spyOn(console, 'log').mockImplementation();
        const errorSpy = jest.spyOn(console, 'error').mockImplementation();
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

        const testError = new Error('Fail');

        logger.info('Test info');
        logger.error('Test error', { error: testError.message, stack: testError.stack });
        logger.warn('Test warn');

        expect(infoSpy).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalled();

        infoSpy.mockRestore();
        errorSpy.mockRestore();
        warnSpy.mockRestore();
    });
});