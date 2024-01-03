import { Request, Response } from "express";
import { AppDataSource } from "../data-source.js";
import { User } from "../entity/User.js";
import { RegisterUserApiPayload } from "../models/api/register-user-api.model.js";
import { ServerInfo } from "../models/server-info.model.js";
import { APIErrorCodes, generateErrorResponse } from "../utils/errors.js";
import { generateUserKey } from "../utils/user.js";
import { UserController } from "./user.controller.js";
import * as url from 'url';
import { AuthService } from "../services/auth.service.js";

export class AuthController {

    static async handlePOSTForLogin(req: Request, res: Response) {
        const { email, password } = req.body;
        const userOrError: User | APIErrorCodes = await AuthService.processLogin(email, password);

        if (!(userOrError instanceof User)) {
            // error
            res.statusCode = 401;
            const { key, description } = generateErrorResponse(userOrError as APIErrorCodes);
            const path = url.format({
                pathname: '/auth/login',
                query: {
                    key, description
                }
            });
            res.redirect(path);
            return;
        }

        req.login(userOrError, (err: any) => {
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
    }

    static async handleUserLogout(req: Request, res: Response) {
        req.logout({ keepSessionInfo: false }, (err) => {
            if (err) res.sendStatus(422);

            res.redirect('/auth/login');
        })
    }

    static async handlePOSTForRegistration(req: Request, res: Response) {
        const { username, password, locale, email } = req.body as RegisterUserApiPayload;
        const serverInfo: ServerInfo = req.app.get('serverInfo');
        const userOrError = await AuthService.registerUserAPI(serverInfo, {
            username,
            email,
            password,
            locale,
            agreement: "TRUE"
        });

        if (userOrError instanceof User) {
            // ok

            // FIXME: inspect and return JSON+LD response if needed

            res.redirect('/auth/login?description=Please login to your account.')
        } else {
            // send error
            const errorCode = userOrError == 'ER_DUP_ENTRY' ? APIErrorCodes.ERR_TAKEN : APIErrorCodes.ERR_INVALID;

            res.status(422);
            res.send(generateErrorResponse(errorCode));
        }
    }


}