import { NextFunction, Request, Response } from "express";
import session from 'express-session';
import passport from 'passport';
import { User } from '../entity/User.js';
import { isProduction } from "../utils/misc.js";

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        if (req.accepts('*/*', 'text/html')) {
            res.redirect('/auth/login?description=Please login.');
            return;
        } else {
            next();
            return;
        }
    } else {
        return res.sendStatus(401);
    }
}

export const sessionConfig = session({ 
    secret: process.env.FEDIMG_SESSION_SECRET, 
    cookie: { 
        secure: isProduction()
    },
    resave: false,
    saveUninitialized: false
});

passport.serializeUser(function (user: User, cb) {
    process.nextTick(function () {
        return cb(null, {...user});
    });
})

passport.deserializeUser(function (user: User, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});
