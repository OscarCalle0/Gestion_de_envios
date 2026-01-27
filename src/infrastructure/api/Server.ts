import dotenv from 'dotenv';
import 'module-alias/register';
dotenv.config();
import { application } from './Application';
import { createDependencyContainer } from '@configuration';
import { ENV } from '@util';

export const start = async () => {
    try {
        createDependencyContainer();
        const server = await application.listen({ port: ENV.PORT, host: '0.0.0.0' });
        application.swagger();
        console.log(`Application running on ${server}`);
    } catch (error) {
        console.error(error);
        await application.close();
    }
};

if (require.main === module) {
    start();
}