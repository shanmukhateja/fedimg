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
            const isUserLocal = verifyUserIsLocal(req.app.get('serverInfo'), usernameOrEmail);
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

            const isJsonLDRequired = req.accepts('application/ld+json') || req.accepts('application/activity+json');
            const isHTMLRequired = req.accepts('html');

            if (isHTMLRequired) {
                let determineUser: User = null;
                determineUser = req.isAuthenticated() ? (req.user as User).email == user.email ? req.user : user : user;
                renderPageWithUserInfo('home/profile.njk', determineUser, res);
            } else if (isJsonLDRequired) {
                res
                .setHeader('Content-Type', 'application/jrd+json; charset=utf-8')
                .send({
                    '@context': [
                        'https://www.w3.org/ns/activitystreams',
                        {
                            "toot": "http://joinmastodon.org/ns#",
                            "alsoKnownAs": {
                                "@id": "as:alsoKnownAs",
                                "@type": "@id"
                            },
                            "movedTo": {
                                "@id": "as:movedTo",
                                "@type": "@id"
                            },
                            "indexable": "toot:indexable"
                        }
                    ],
                    inbox: `${user.id}/inbox`,
                    outbox: `${user.id}/outbox`,
                    followers: `${user.id}/followers`,
                    following: `${user.id}/following`,
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