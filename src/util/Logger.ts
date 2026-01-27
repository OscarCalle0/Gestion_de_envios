import { ENV } from './Envs';

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    service: string;
    message: string;
    context?: Record<string, unknown>;
    requestId?: string;
}

class Logger {
    private serviceName: string;
    private isProduction: boolean;

    constructor() {
        this.serviceName = ENV.SERVICE_NAME || 'gestion-envios';
        this.isProduction = ENV.NODE_ENV === 'production';
    }

    private formatLog(entry: LogEntry): string {
        if (this.isProduction) {
            return JSON.stringify(entry);
        }
        const contextStr = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
        const reqIdStr = entry.requestId ? ` [${entry.requestId}]` : '';
        return `[${entry.timestamp}] [${entry.level}]${reqIdStr} ${entry.message}${contextStr}`;
    }

    private log(level: LogLevel, message: string, context?: Record<string, unknown>, requestId?: string): void {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            service: this.serviceName,
            message,
            context,
            requestId,
        };

        const formattedLog = this.formatLog(entry);

        switch (level) {
            case LogLevel.ERROR:
                console.error(formattedLog);
                break;
            case LogLevel.WARN:
                console.warn(formattedLog);
                break;
            case LogLevel.DEBUG:
                if (!this.isProduction) {
                    console.debug(formattedLog);
                }
                break;
            default:
                console.log(formattedLog);
        }
    }

    debug(message: string, context?: Record<string, unknown>, requestId?: string): void {
        this.log(LogLevel.DEBUG, message, context, requestId);
    }

    info(message: string, context?: Record<string, unknown>, requestId?: string): void {
        this.log(LogLevel.INFO, message, context, requestId);
    }

    warn(message: string, context?: Record<string, unknown>, requestId?: string): void {
        this.log(LogLevel.WARN, message, context, requestId);
    }

    error(message: string, context?: Record<string, unknown>, requestId?: string): void {
        this.log(LogLevel.ERROR, message, context, requestId);
    }

    request(data: { method: string; url: string; statusCode: number; responseTime: number }, requestId?: string): void {
        const { method, url, statusCode, responseTime } = data;
        this.info(
            `${method} ${url} ${statusCode} - ${responseTime}ms`,
            { method, url, statusCode, responseTime },
            requestId,
        );
    }

    database(operation: string, table: string, duration: number, success: boolean): void {
        const level = success ? LogLevel.DEBUG : LogLevel.ERROR;
        this.log(level, `DB ${operation} on ${table}`, { operation, table, duration, success });
    }

    cache(operation: string, key: string, hit: boolean): void {
        this.debug(`Cache ${operation}: ${key}`, { operation, key, hit });
    }
}

export const logger = new Logger();
