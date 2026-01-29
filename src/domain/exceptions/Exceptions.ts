import { ErrorCode, PostgresErrorCode, StatusCode } from './ErrorCode';

export abstract class Exception {
    isError: boolean = true;
    message: string;
    code: ErrorCode;
    statusCode: number;
    cause: string | null;

    constructor(message: string, code: ErrorCode, statusCode: number, cause?: string) {
        this.message = message;
        this.code = code;
        this.statusCode = statusCode;
        this.cause = cause || null;
    }
}

export class BadMessageException extends Exception {
    constructor(cause: string, message: string) {
        super(message, ErrorCode.BAD_MESSAGE, StatusCode.BAD_REQUEST, cause);
    }
}

export class RepositoryException extends Exception {
    constructor() {
        const message = 'Ocurrió un error al momento de guardar la guía';
        super(message, ErrorCode.REPOSITORY_ERROR, StatusCode.INTERNAL_ERROR);
    }
}

export class PubSubException extends Exception {
    constructor(message: string, cause: string) {
        super(message, ErrorCode.PUBSUB_ERROR, StatusCode.INTERNAL_ERROR, cause);
    }
}

export class FirestoreException extends Exception {
    constructor(code: number | string | undefined, message: string) {
        const fsError = ErrorCode.REPOSITORY_ERROR;
        switch (code) {
            case 1:
            case '1':
                super(message, fsError, StatusCode.INTERNAL_ERROR, 'Firestore action cancelled');
                break;
            case 2:
            case '2':
                super(message, fsError, StatusCode.INTERNAL_ERROR, 'Firestore unknown error');
                break;
            case 3:
            case '3':
                super(message, fsError, StatusCode.OK, 'Firestore invalid argument');
                break;
            case 4:
            case '4':
                super(message, fsError, StatusCode.INTERNAL_ERROR, 'Firestore deadline exceeded');
                break;
            case 5:
            case '5':
                super(message, fsError, StatusCode.INTERNAL_ERROR, 'Update nonexistent document');
                break;
            case 6:
            case '6':
                super(message, fsError, StatusCode.OK, 'Firestore document already exists');
                break;
            case 7:
            case '7':
                super(message, fsError, StatusCode.INTERNAL_ERROR, 'Firestore permission denied');
                break;
            case 8:
            case '8':
                super(message, fsError, StatusCode.OK, 'Firestore resource exhausted');
                break;
            case 9:
            case '9':
                super(message, fsError, StatusCode.INTERNAL_ERROR, 'Firestore precondition failed');
                break;
            default:
                super(message, fsError, StatusCode.INTERNAL_ERROR, 'Defaulted unkwnown fs error');
                break;
        }
    }
}

export class PostgresError extends Exception {
    constructor(code: string, message: string, pgError: ErrorCode = ErrorCode.REPOSITORY_ERROR) {
        switch (code) {
            case PostgresErrorCode.RAISE_EXCEPTION:
                super(message, pgError, StatusCode.BAD_REQUEST, 'Excepción lanzada desde una función PL/pgSQL');
                break;
            case PostgresErrorCode.UNIQUE_VIOLATION:
                super(message, pgError, StatusCode.CONFLICT, 'Intentando insertar llave única duplicada');
                break;
            case PostgresErrorCode.CHECK_VIOLATION:
                super(message, pgError, StatusCode.BAD_REQUEST, 'Acción viola una restricción de la tabla');
                break;
            case PostgresErrorCode.NOT_NULL_VIOLATION:
                super(message, pgError, StatusCode.BAD_REQUEST, 'Insertando una llave nula que no puede serlo');
                break;
            case PostgresErrorCode.UNDEFINED_FUNCTION:
                super(message, pgError, StatusCode.NOT_FOUND, 'llamado a funcion Inexistente');
                break;
            case PostgresErrorCode.UNDEFINED_TABLE:
                super(message, pgError, StatusCode.NOT_FOUND, 'llamado a tabla Inexistente');
                break;
            case PostgresErrorCode.UNDEFINED_PARAMETER:
                super(message, pgError, StatusCode.NOT_FOUND, 'llamado a parametro Inexistente');
                break;
            case PostgresErrorCode.UNDEFINED_OBJECT:
                super(message, pgError, StatusCode.NOT_FOUND, 'llamado a objeto Inexistente');
                break;
            case PostgresErrorCode.UNDEFINED_COLUMN:
                super(message, pgError, StatusCode.NOT_FOUND, 'llamado a columna Inexistente');
                break;
            case PostgresErrorCode.QUERY_CANCELED:
                super(message, pgError, StatusCode.REQUEST_TIMEOUT, 'Query cancelled');
                break;
            case PostgresErrorCode.CONNECTION_REFUSED:
                super(message, pgError, StatusCode.SERVICE_UNAVAILABLE, 'Conexión con pg rechazada');
                break;
            default:
                super(message, pgError, StatusCode.INTERNAL_ERROR, 'Error desconocido');
                break;
        }
    }
}
