import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import passport from 'passport';
import {passportConfig} from './middlewares/auth.middleware.js';

import { AppDataSource } from "./data-source.js";
import { userRouter } from './routes/users.route.js';
import { usersApiRouter } from './routes/api/users-api.routes.js';
import { mediaApiRouter } from './routes/media.route.js';

((async () => {
    // Initialize database
    const dbConn = await AppDataSource.initialize();

    console.log('Database initialized.');

    const app = express();

    app.set('dbConn', dbConn);

    // MIDDLEWARES

    // passport
    passport.use(passportConfig);
    app.use(passport.initialize());

    app.use([
        express.json(),
        express.urlencoded({ extended: true }),
        cors()
    ]);

    // Routes
    app.use('/users', userRouter);
    // API routes
    // FIXME: Need to separate '/api/v1' here
    app.use('/api/v1/users', usersApiRouter);
    // FIXME: add static folder for multer
    app.use('/api/v1/media', mediaApiRouter);


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
