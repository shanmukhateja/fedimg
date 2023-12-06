import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import passport from "passport";
import url from 'url';
import { APIErrorCodes, generateErrorResponse } from "../utils/errors.js";
import { User } from "../entity/User.js";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";

export const authRouter = Router();

authRouter.get('/login', (req, res) => {
    res.render('login.njk');
})

authRouter.get('/register', (req, res) => {
    res.render('register.njk');
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
            res.sendStatus(401);
            return;
        }
        res.redirect('/home')
    });

})

authRouter.get('/logout', ensureAuthenticated, (req, res) => {
    req.logOut({keepSessionInfo: false}, (err) => {
        if (err) res.sendStatus(422);

        res.redirect('/auth/login');
    })
})