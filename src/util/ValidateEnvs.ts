export const validateEnvs = (ENV: Record<string, string | number | boolean | undefined>): never | void => {
    const indefinidas = [];
    const sinInformacion: string[] = [];
    for (const key in ENV) {
        if (ENV[key] === '' || ENV[key] === undefined || ENV[key] === null) {
            sinInformacion.push(key);
            continue;
        }
        if (ENV[key] !== '') {
            continue;
        }
        if (!process.env[key]) indefinidas.push(key);
    }
    if (sinInformacion.length) {
        console.info(
            `Las siguientes variables no tienen información, es posible que el programa no funcione de forma correcta:\n${sinInformacion.join(
                ' \n',
            )}\n`,
        );
    }
    if (indefinidas.length) {
        throw new Error(`Las siguientes variables no están definidas en los ENV:\n${indefinidas.join(' \n')}\n`);
    }
};
