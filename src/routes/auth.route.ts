import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import passport from "passport";
import url from 'url';
import { APIErrorCodes, generateErrorResponse } from "../utils/errors.js";
import { User } from "../entity/User.js";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";
import axios from "axios";
import { RegisterUserApiPayload } from "../models/api/register-user-api.model.js";
import { ServerInfo } from "../models/server-info.model.js";
import { getBaseURL } from "../utils/url.js";

export const authRouter = Router();

authRouter.get('/login', (req, res) => {
    res.render('login.njk');
})

authRouter.post('/login', passport.authenticate('session'), async (req, res) => {
    const { email, password } = req.body;
    const userOrError: User | APIErrorCodes = await AuthController.processLogin(email, password);

    if (!(userOrError instanceof User)) {
        // error
        res.statusCode = 401;
        const path = url.format({
            pathname: '/auth/login',
            query: { ...generateErrorResponse(userOrError as APIErrorCodes) }
        });
        res.redirect(path);
        return;
    }

    req.login(userOrError, err => {
        if (err) {
            res.sendStatus(422);
            return;
        }

        // Check if HTML is requested
        if (req.accepts('text/html')) {
            res.redirect('/home');
            return;
        } else if (req.accepts('application/json', 'application/ld+json', 'application/activity+json')) {
            // FIXME: JSON+LD
            res.send(userOrError);
        } else {
            res.sendStatus(500)
        }
    });

})

authRouter.get('/logout', ensureAuthenticated, (req, res) => {
    req.logOut({ keepSessionInfo: false }, (err) => {
        if (err) res.sendStatus(422);

        res.redirect('/auth/login');
    })
})


authRouter.get('/register', (req, res) => {
    res.render('register.njk');
})

authRouter.post('/register', async (req, res) => {
    const { username, password, locale, email } = req.body as RegisterUserApiPayload;
    const serverInfo: ServerInfo = req.app.get('serverInfo');
    try {
        await axios.post(`${getBaseURL(serverInfo)}api/v1/users`, {
            username,
            email,
            password,
            locale,
            "agreement": "TRUE"
        });

        res.redirect('/auth/login?description=Please login to your account.')
    } catch (error) {
        console.error(error);
        res.sendStatus(500)
    }
})