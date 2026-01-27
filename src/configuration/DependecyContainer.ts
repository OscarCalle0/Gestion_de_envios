import { Container } from 'inversify';
import pgPromise from 'pg-promise';
import { TYPES } from '@configuration';
import { ENV } from '@util';
import { CotizarEnvioAppService } from '@application/services/CotizarEnvioAppService';
import { RegistrarEnvioAppService } from '@application/services/RegistrarEnvioAppService';
import { ConsultarEnvioAppService } from '@application/services/ConsultarEnvioAppService';
import { ActualizarEstadoAppService } from '@application/services/ActualizarEstadoAppService';
import { ConsultarTarifasAppService } from '@application/services/ConsultarTarifasAppService';
import { PostgresEnvioRepository } from '@infrastructure/repositories/PostgresRepository';
import { RedisCacheService, CacheService } from '@infrastructure/cache/RedisCache';
import { EnvioRepository, TarifaRepository } from '@domain/repository/EnvioRepository';

export const DEPENDENCY_CONTAINER = new Container();

export const createDependencyContainer = (): void => {
    const pgp = pgPromise();
    const db = pgp({
        host: ENV.DB_HOST,
        port: ENV.DB_PORT,
        user: ENV.DB_USER,
        password: ENV.DB_PASSWORD,
        database: ENV.DB_NAME,
    });

    DEPENDENCY_CONTAINER.bind(TYPES.PostgresDatabase).toConstantValue(db);

    DEPENDENCY_CONTAINER.bind<CacheService>(TYPES.CacheService).to(RedisCacheService).inSingletonScope();

    DEPENDENCY_CONTAINER.bind<EnvioRepository>(TYPES.EnvioRepository).to(PostgresEnvioRepository).inSingletonScope();

    DEPENDENCY_CONTAINER.bind<TarifaRepository>(TYPES.TarifaRepository).to(PostgresEnvioRepository).inSingletonScope();

    DEPENDENCY_CONTAINER.bind<CotizarEnvioAppService>(TYPES.CotizarEnvioAppService)
        .to(CotizarEnvioAppService)
        .inSingletonScope();

    DEPENDENCY_CONTAINER.bind<RegistrarEnvioAppService>(TYPES.RegistrarEnvioAppService)
        .to(RegistrarEnvioAppService)
        .inSingletonScope();

    DEPENDENCY_CONTAINER.bind<ConsultarEnvioAppService>(TYPES.ConsultarEnvioAppService)
        .to(ConsultarEnvioAppService)
        .inSingletonScope();

    DEPENDENCY_CONTAINER.bind<ActualizarEstadoAppService>(TYPES.ActualizarEstadoAppService)
        .to(ActualizarEstadoAppService)
        .inSingletonScope();

    DEPENDENCY_CONTAINER.bind<ConsultarTarifasAppService>(TYPES.ConsultarTarifasAppService)
        .to(ConsultarTarifasAppService)
        .inSingletonScope();
};
