import { injectable } from 'inversify';
import Redis from 'ioredis';
import { ENV } from '@util';

export interface CacheService {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    delPattern(pattern: string): Promise<void>;
    isConnected(): boolean;
}

@injectable()
export class RedisCacheService implements CacheService {
    private client: Redis | null = null;
    private connected: boolean = false;
    private readonly defaultTTL: number;

    constructor() {
        this.defaultTTL = ENV.REDIS_TTL;
        this.connect();
    }

    private connect(): void {
        try {
            this.client = new Redis({
                host: ENV.REDIS_HOST,
                port: ENV.REDIS_PORT,
                password: ENV.REDIS_PASSWORD || undefined,
                retryStrategy: (times: number) => {
                    if (times > 3) {
                        console.warn('[Redis] No se pudo conectar después de 3 intentos. Continuando sin caché.');
                        return null;
                    }
                    return Math.min(times * 200, 2000);
                },
                maxRetriesPerRequest: 1,
                lazyConnect: true,
            });

            this.client.on('connect', () => {
                this.connected = true;
                console.log('[Redis] Conexión establecida exitosamente');
            });

            this.client.on('error', (err: Error) => {
                this.connected = false;
                console.warn('[Redis] Error de conexión:', err.message);
            });

            this.client.on('close', () => {
                this.connected = false;
                console.log('[Redis] Conexión cerrada');
            });

            this.client.connect().catch(() => {
                console.warn('[Redis] No disponible. El servicio continuará sin caché.');
            });
        } catch (error) {
            console.warn('[Redis] Error al inicializar:', error);
            this.connected = false;
        }
    }

    isConnected(): boolean {
        return this.connected && this.client !== null;
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.isConnected() || !this.client) {
            return null;
        }

        try {
            const data = await this.client.get(key);
            if (data) {
                console.log(`[Redis] Cache HIT: ${key}`);
                return JSON.parse(data) as T;
            }
            console.log(`[Redis] Cache MISS: ${key}`);
            return null;
        } catch (error) {
            console.warn(`[Redis] Error al obtener ${key}:`, error);
            return null;
        }
    }

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        if (!this.isConnected() || !this.client) {
            return;
        }

        try {
            const ttl = ttlSeconds ?? this.defaultTTL;
            await this.client.setex(key, ttl, JSON.stringify(value));
            console.log(`[Redis] Cache SET: ${key} (TTL: ${ttl}s)`);
        } catch (error) {
            console.warn(`[Redis] Error al guardar ${key}:`, error);
        }
    }

    async del(key: string): Promise<void> {
        if (!this.isConnected() || !this.client) {
            return;
        }

        try {
            await this.client.del(key);
            console.log(`[Redis] Cache DEL: ${key}`);
        } catch (error) {
            console.warn(`[Redis] Error al eliminar ${key}:`, error);
        }
    }

    async delPattern(pattern: string): Promise<void> {
        if (!this.isConnected() || !this.client) {
            return;
        }

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
                console.log(`[Redis] Cache DEL pattern: ${pattern} (${keys.length} keys)`);
            }
        } catch (error) {
            console.warn(`[Redis] Error al eliminar patrón ${pattern}:`, error);
        }
    }
}
