import { NextFunction, Request, Response } from "express";
import * as session from 'express-session';
import * as passport from 'passport';
import { User } from '../entity/User.js';
import { isProduction } from "../utils/misc.js";

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        next();
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
