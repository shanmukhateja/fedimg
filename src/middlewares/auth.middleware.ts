import { NextFunction, Request, Response } from "express"
import { Strategy as LocalStrategy } from 'passport-local';
import { UserController } from "../controllers/user.controller.js";

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.sendStatus(401);
}

export const passportConfig = new LocalStrategy(
    async (username, password, done) => {
        const user = await UserController.getUserById(username);
        const err = !user;
        if (err) {
            return done(err)
        }
        if (!user) {
            return done(null, false, { message: 'Incorrect username.' })
        }
        if (!user.validPassword(password)) {
            return done(null, false, { message: 'Incorrect password.' })
        }
        return done(null, user)
    }
)