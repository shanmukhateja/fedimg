import { NextFunction, Request, Response } from "express";
import session from 'express-session';
import passport from 'passport';
import { User } from '../entity/User.js';

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.sendStatus(401);
}

// FIXME: `secure` should be true in prod.
export const sessionConfig = session({ 
    secret: process.env.FEDIMG_SESSION_SECRET, 
    cookie: { 
        secure: false
    }
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
