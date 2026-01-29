import dotenv from 'dotenv';
import 'module-alias/register';
dotenv.config();
import { application } from './Application';
import { createDependencyContainer } from '@configuration';
import { ENV } from '@util';

export const start = async () => {
    try {
        createDependencyContainer();

        application.get('/', async (_request, reply) => {
            return reply.redirect('/docs');
        });

        const server = await application.listen({
            port: ENV.PORT,
            host: '0.0.0.0'
        });

        application.swagger();

        console.log(`Application running on ${server}`);
        console.log(`Documentation available at ${server}/docs`);

    } catch (error) {
        console.error('Error starting server:', error);
        await application.close();
        process.exit(1);
    }
};

if (require.main === module) {
    start();
}