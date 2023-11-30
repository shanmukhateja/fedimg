import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import passport from "passport";

export const authRouter = Router();

authRouter.get('/login', (req, res) => {
    res.render('login.njk');
})

authRouter.get('/register', (req, res) => {
    res.render('register.njk');
})

authRouter.post('/login', passport.authenticate('session'), async (req, res) => {
    const {email, password} = req.body;
    const userOrError = await AuthController.processLogin(email, password);

    if (typeof userOrError == 'string') {
        // error
        res.statusCode = 401;
        res.send(userOrError);
        return;
    }

    req.login(userOrError, err => {
        if (err) {
            res.sendStatus(401);
            return;
        }
        res.sendStatus(200);
    });

})