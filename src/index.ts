import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { AppDataSource } from "./data-source.js";
import { userRouter } from './routes/users.route.js';

((async () => {
    // Initialize database
    const dbConn = await AppDataSource.initialize();

    console.log('Database initialized.');

    const app = express();

    app.set('dbConn', dbConn);

    // MIDDLEWARES
    app.use([
        express.json(),
        express.urlencoded({ extended: true }),
        cors()
    ]);

    // Routes
    app.use('/users', userRouter);

    // server info
    // Note: can this be improved?
    app.set('serverInfo', {
        // FIXME: schema detection
        schema: 'http',
        hostname: process.env.FEDIMG_SERVER_HOSTNAME,
        port: process.env.FEDIMG_SERVER_PORT
    });

    // LISTEN
    const appPortNo = process.env.FEDIMG_SERVER_PORT || 8080;
    app.listen(appPortNo, () => {
        console.log(`Listening on port ${appPortNo}`)
    })

}))();
