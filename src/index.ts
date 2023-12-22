import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import passport from 'passport';

import nunjucks from 'nunjucks';

import morgan from 'morgan';

import { AppDataSource } from "./data-source.js";
import { userRouter } from './routes/users.route.js';
import { usersApiRouter } from './routes/api/users-api.routes.js';
import { mediaApiRouter } from './routes/media.route.js';
import { viewsRouter } from './routes/views.route.js';
import { authRouter } from './routes/auth.route.js';
import { sessionConfig } from './middlewares/auth.middleware.js';
import { isProduction } from './utils/misc.js';
import { homeRouter } from './routes/home.route.js';
import { getStaticAssetsPath } from './utils/path.js';
import { wellKnownRouter } from './routes/well-known.route.js';

((async () => {
    // Initialize database
    const dbConn = await AppDataSource.initialize();

    console.log('Database initialized.');

    const app = express();

    app.set('dbConn', dbConn);

    // MIDDLEWARES

    // logging
    app.use(morgan(isProduction() ? 'short' : 'dev'));

    // passport
    app.use(sessionConfig);
    app.use(passport.session());

    app.use([
        express.json(),
        express.urlencoded({ extended: true }),
        cors()
    ]);

    // Nunjucks
    nunjucks.configure('src/views', {
        autoescape: true,
        express: app,
        dev: !isProduction(),
        watch: true
    })

    // multer
    app.use('/static', express.static(getStaticAssetsPath()));

    // Routes
    app.use('/.well-known', wellKnownRouter);
    app.use('', viewsRouter);
    app.use('/auth', authRouter);
    app.use('/users', userRouter);
    app.use('/home', homeRouter);
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
