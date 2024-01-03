import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import * as passport from "passport";
import { ensureAuthenticated } from "../middlewares/auth.middleware.js";

export const authRouter = Router();

authRouter.get('/login', (req, res) => {
    res.render('login.njk');
})

authRouter.post('/login', passport.authenticate('session'), async (req, res) => {
    AuthController.handlePOSTForLogin(req, res);
})

authRouter.get('/logout', ensureAuthenticated, (req, res) => {
    AuthController.handleUserLogout(req, res);
})


authRouter.get('/register', (req, res) => {
    res.render('register.njk');
})

authRouter.post('/register', async (req, res) => {
    AuthController.handlePOSTForRegistration(req, res);
})