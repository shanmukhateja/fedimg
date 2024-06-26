import { hash, compare } from "bcrypt";
import { AppDataSource } from "../data-source.js";
import { User } from "../entity/User.js";
import { Request, Response } from "express";
import { renderPageWithUserInfo } from "../utils/render.js";
import { verifyUserIsLocal } from "../utils/user.js";
import { UserLookupController } from "./user-lookup.controller.js";
import { UserService } from "../services/user.service.js";

export class UserController {

    static async handleUserByNameOrEmail(req: Request, res: Response) {
        try {
            const usernameOrEmail = req.params.usernameOrEmail;
            const isUserLocal = await verifyUserIsLocal(usernameOrEmail);
            let user = null;
            if (isUserLocal) {
                user = await UserService.getUserByIdSafe(usernameOrEmail);
                if (!user) {
                    // try email
                    const strippedUserId = usernameOrEmail.startsWith('@') ? usernameOrEmail.slice(1) : usernameOrEmail;
                    user = await UserService.getUserByKeySafe('email', strippedUserId);
                }
            } else {
                // Sends a 'mock' User.entity.ts object
                user = await UserLookupController.lookupUser(usernameOrEmail);
            }
            if (!user) {
                res.statusCode = 404;
                // Match error with Mastodon API
                res.send({ error: 'Not found' });
                return;
            }

            const isJsonLDRequired = req.accepts(['application/json', 'application/activity+json', 'application/ld+json']);
            const isHTMLRequired = req.accepts('html');

            if (isHTMLRequired) {
                let determineUser: User = null;
                determineUser = req.isAuthenticated() ? (req.user as User).email == user.email ? req.user : user : user;
                renderPageWithUserInfo('home/profile.njk', determineUser, res);
            } else if (isJsonLDRequired) {
                user = user as User;
                res
                .setHeader('Content-Type', 'application/activity+json; charset=utf-8')
                .send({
                    '@context': [
                        'https://www.w3.org/ns/activitystreams',
                    ],
                    url: user.id,
                    inbox: `${user.id}/inbox`,
                    outbox: `${user.id}/outbox`,
                    followers: `${user.id}/followers`,
                    following: `${user.id}/following`,
                    published: user.createdAt,
                    // FIXME: this should be derived from app config
                    manuallyApprovesFollowers: false,
                    // FIXME: this should be derived from app config
                    indexable: true,
                    ...user
                });
            } else {
                res.send(400);
            }
        } catch (error) {
            console.error(error);
            res.sendStatus(500)
        }
    }


    static async generateHashedPassword(password: string) {
        const saltRounds = 10;
        return await hash(password, saltRounds)
    }


    static async validatePasswordByUsername(username: string, password: string) {
        if (!username || !password) return false;
        const user = await UserService.getUserById(username);
        return await compare(password, user.password);
    }

    static async updateDisplayName(username: string, newName: string) {
        const userRepo = AppDataSource.getRepository(User);

        return await userRepo.update({ preferredUsername: username }, {
            displayName: newName
        });

    }
}