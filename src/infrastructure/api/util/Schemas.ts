import Joi from 'joi';
import { parse, decode } from '@util';
import { pubSubValidate, PubSubPayload } from '@infrastructure/api/validate';
import { BadMessageException, Messages } from '@domain/exceptions';

type Schema = Joi.ObjectSchema | Joi.ArraySchema;

export const validateData = <T>(schema: Schema, dataToValidate: unknown): T => {
    if (dataToValidate) {
        const { error, value } = schema.validate(dataToValidate, { convert: true });
        if (error) {
            console.error(`schemaError: ${JSON.stringify(error)}`);
            throw new BadMessageException(error.message, Messages.MSG_VALIDATE_ERROR);
        }
        return value;
    }
    throw new Error('mensaje indefinido');
};

export const validateDataPubSub = <T>(schema: Schema, dataToValidate: unknown): T => {
    const pubSubPayload = validatePubSub(dataToValidate);
    if (pubSubPayload) {
        const decodeMessage = parse(decode(pubSubPayload.message.data));
        const { error, value } = schema.validate(decodeMessage, { convert: true });
        if (error) {
            console.error(`schemaError: ${JSON.stringify(error)}`);
            throw new BadMessageException(error.message, 'error validanto data de entrada');
        }
        return value;
    }
    throw new BadMessageException('no se encontró data de pubsub', 'error validanto data de entrada');
};

export const validatePubSub = (dataToValidate: unknown): PubSubPayload | null => {
    if (dataToValidate) {
        const { error, value } = pubSubValidate.validate(dataToValidate, { convert: true });
        if (!error) return value;
    }
    return null;
};
