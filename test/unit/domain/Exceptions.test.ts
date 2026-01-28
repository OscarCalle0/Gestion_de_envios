import { 
    RepositoryException, 
    PubSubException, 
    FirestoreException,
    BadMessageException,
    PostgresError
} from '../../../src/domain/exceptions/Exceptions';
import { ErrorCode, PostgresErrorCode } from '../../../src/domain/exceptions/ErrorCode';

describe('Domain Exceptions Coverage', () => {

    it('debería cubrir RepositoryException (0 argumentos)', () => {
        const error = new RepositoryException();
        expect(error.message).toBe('Ocurrió un error al momento de guardar la guía');
        expect(error.code).toBe(ErrorCode.REPOSITORY_ERROR);
    });

    it('debería cubrir BadMessageException y PubSubException (2 argumentos)', () => {
        const badMsg = new BadMessageException('causa test', 'mensaje test');
        const pubSub = new PubSubException('error pubsub', 'causa pubsub');
        
        expect(badMsg.cause).toBe('causa test');
        expect(pubSub.message).toBe('error pubsub');
    });

    it('debería cubrir FirestoreException y sus ramas del switch', () => {
        // Probamos un caso específico y el default para cubrir el switch
        const error1 = new FirestoreException(1, 'Error uno');
        const errorDefault = new FirestoreException(999, 'Error desconocido');
        
        expect(error1.cause).toBe('Firestore action cancelled');
        expect(errorDefault.cause).toBe('Defaulted unkwnown fs error');
    });

    it('debería cubrir PostgresError y sus ramas principales', () => {
        // Cubrimos un par de casos de PostgresErrorCode para subir el % de ramas
        const uniqueErr = new PostgresError(PostgresErrorCode.UNIQUE_VIOLATION, 'Duplicate');
        const defaultErr = new PostgresError('99999', 'Unknown');

        expect(uniqueErr.statusCode).toBe(409); // StatusCode.CONFLICT
        expect(defaultErr.cause).toBe('Error desconocido');
    });
});