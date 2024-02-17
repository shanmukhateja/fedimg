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

/**
 * This function will verify whether resource being accessed is owned by the authenticated user. 
 * @param req Request
 * @param res Response
 * @param next Callback function
 */
export function ensureSelfAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated()) {
        return res.sendStatus(401);
    }

    // FIXME: add more ways to detect incoming resource
    const {usernameOrEmail} = req.params;
    const authUser = req.user as User;
    if (usernameOrEmail == authUser.preferredUsername || usernameOrEmail == authUser.email) {
        next();
    } else {
        return res.sendStatus(403);
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
