import { NextFunction, Request, Response } from "express";
import session from 'express-session';
import passport from 'passport';
import { User } from '../entity/User.js';
import { isProduction } from "../utils/misc.js";

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.sendStatus(401);
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
        return cb(null, {
            _id: user._id,
            id: user.id,
            username: user.preferredUsername,
            email: user.email
        });
    });
})

passport.deserializeUser(function (user: User, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});
