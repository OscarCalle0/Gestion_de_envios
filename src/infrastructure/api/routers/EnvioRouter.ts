import { FastifyInstance } from 'fastify';
import { DEPENDENCY_CONTAINER, TYPES } from '@configuration';
import { CotizarEnvioAppService } from '@application/services/CotizarEnvioAppService';
import { RegistrarEnvioAppService } from '@application/services/RegistrarEnvioAppService';
import { ConsultarEnvioAppService } from '@application/services/ConsultarEnvioAppService';
import { ActualizarEstadoAppService } from '@application/services/ActualizarEstadoAppService';
import { ConsultarTarifasAppService } from '@application/services/ConsultarTarifasAppService';
import {
    CotizarValidate,
    RegistrarValidate,
    ConsultarGuiaValidate,
    ActualizarEstadoValidate,
} from '../validate/EnvioValidate';
import {
    cotizarSchema,
    registrarSchema,
    consultarEnvioSchema,
    actualizarEstadoSchema,
    consultarTarifasSchema,
} from '../swagger/schemas/envioSchemas';

export const EnvioRouter = async (fastify: FastifyInstance) => {
    const cotizarService = DEPENDENCY_CONTAINER.get<CotizarEnvioAppService>(TYPES.CotizarEnvioAppService);
    const registrarService = DEPENDENCY_CONTAINER.get<RegistrarEnvioAppService>(TYPES.RegistrarEnvioAppService);
    const consultarService = DEPENDENCY_CONTAINER.get<ConsultarEnvioAppService>(TYPES.ConsultarEnvioAppService);
    const actualizarEstadoService = DEPENDENCY_CONTAINER.get<ActualizarEstadoAppService>(
        TYPES.ActualizarEstadoAppService,
    );
    const consultarTarifasService = DEPENDENCY_CONTAINER.get<ConsultarTarifasAppService>(
        TYPES.ConsultarTarifasAppService,
    );

    fastify.post('/cotizar', { schema: cotizarSchema }, async (request, reply) => {
        const { error, value } = CotizarValidate.validate(request.body);
        if (error) {
            return reply.status(400).send({
                isError: true,
                error: error.details[0].message,
            });
        }
        const result = await cotizarService.run(value);
        return reply.status(200).send(result);
    });


    fastify.post('/envios', { schema: registrarSchema }, async (request, reply) => {
        const { error, value } = RegistrarValidate.validate(request.body);
        if (error) {
            return reply.status(400).send({
                isError: true,
                error: error.details[0].message,
            });
        }
        const result = await registrarService.run(value);
        return reply.status(201).send(result);
    });


    fastify.get('/envios/:guia', { schema: consultarEnvioSchema }, async (request, reply) => {
        const params = request.params as { guia: string };
        const { error } = ConsultarGuiaValidate.validate({ guia: params.guia });
        if (error) {
            return reply.status(400).send({
                isError: true,
                error: error.details[0].message,
            });
        }
        const result = await consultarService.run(params.guia);
        return reply.status(200).send(result);
    });

    fastify.patch('/envios/:guia/estado', { schema: actualizarEstadoSchema }, async (request, reply) => {
        const params = request.params as { guia: string };
        const { error: paramsError } = ConsultarGuiaValidate.validate({ guia: params.guia });
        if (paramsError) {
            return reply.status(400).send({
                isError: true,
                error: paramsError.details[0].message,
            });
        }

        const { error: bodyError, value } = ActualizarEstadoValidate.validate(request.body);
        if (bodyError) {
            return reply.status(400).send({
                isError: true,
                error: bodyError.details[0].message,
            });
        }

        const result = await actualizarEstadoService.run(params.guia, value);
        return reply.status(200).send(result);
    });

    fastify.get('/tarifas', { schema: consultarTarifasSchema }, async (_request, reply) => {
        const result = await consultarTarifasService.run();
        return reply.status(200).send(result);
    });
};
