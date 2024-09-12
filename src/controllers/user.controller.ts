import { hash, compare } from "bcrypt";
import { AppDataSource } from "../data-source.js";
import { User } from "../entity/User.js";
import { Request, Response } from "express";
import { renderPageWithUserInfo } from "../utils/render.js";
import { verifyUserIsLocal } from "../utils/user.js";
import { UserLookupController } from "./user-lookup.controller.js";
import { UserService } from "../services/user.service.js";
import { ActivityStreamTypes, FollowActivityModel } from "../models/activity.model.js";
import { generateASId, getBaseURL, getIdFromEmail, sendRequest } from "../utils/url.js";
import { ActivityController } from "./activity.controller.js";
import { UserLookupService } from "../services/user-lookup.service.js";
import { AxiosError } from "axios";
import { HttpSignature } from "../models/http-signature.model.js";
import { ServerInfo } from "../models/server-info.model.js";

export class UserController {

    static async handleDoFollow(userEmail: string, res: Response) {
        const object = await getIdFromEmail(userEmail);

        const followPayload: FollowActivityModel = {
            "@context": "https://www.w3.org/ns/activitystreams",
            type: ActivityStreamTypes.FOLLOW,
            actor: (res.req.user as User).id,
            object,
        }

        console.log(followPayload);

        await ActivityController.handleActivityStreamEvent(followPayload, res);
    }

    static async handleDoUnfollow(userEmail: string, res: Response) {
        const object = await getIdFromEmail(userEmail);

        // remove user from logged in user's followers or following collection
        const srcUser = await UserService.getUserById((res.req.user as User).preferredUsername);
        if (!srcUser.following) srcUser.following = [];

        // FIXME: currently hardcoded to removing foreign user from local user's following collection.
        //        Need to support when remote server sends Unfollow request.
        srcUser.following = srcUser.following?.filter(e => e.email !== userEmail);
        await srcUser.save();

        // Send unfollow request to server.
        // FIXME: this step is not needed when we receive unfollow request from remote server.
        const objectUser = UserLookupService.parseUserInputString(userEmail);

        const objectUserInboxURL = `https://${objectUser.domain}/users/${objectUser.username}/inbox`;

        const serverInfo: ServerInfo = res.req.app.get('serverInfo');
			// FIXME: do we need to save this id in db?
			// FIXME: duplicate code
			const followRequestAcceptedId = generateASId();
			const httpSignature = new HttpSignature(null);

            const unfollowPayload = {
                "@context": "https://www.w3.org/ns/activitystreams",
                type: ActivityStreamTypes.UNDO,
                actor: (res.req.user as User).id,
                object: {
                    type: ActivityStreamTypes.FOLLOW,
                    "id": `${getBaseURL(serverInfo)}${followRequestAcceptedId}`,
                    actor: (res.req.user as User).id,
                    object
                },
            }
			// 1.b generate signature, digest headers
			const genSigHeaders = await httpSignature.generate({
				inboxUrl: objectUserInboxURL,
				serverInfo,
				senderId: unfollowPayload.actor,
				recipientId:  object,
				data: unfollowPayload
			});

			await sendRequest(objectUserInboxURL, 'POST', genSigHeaders, unfollowPayload)
			.then(response => {
				console.log('GOT RESPONSE FOR DO UNFOLLOW REQUEST.', response.headers);
				console.log('GOT RESPONSE FOR DO UNFOLLOW REQUEST.', response.status);
				console.log('GOT RESPONSE FOR DO UNFOLLOW REQUEST.', response.statusText);
			})
			.catch((error: AxiosError) => {
				delete error.response?.request;
				console.log('GOT ERROR FOR DO UNFOLLOW REQUEST');
				console.error('error code: ', error.code)
				console.error('request headers: ', error.request?._header)
				console.error('generated headers: ', genSigHeaders)
				console.error('response data: ', error.response.data)
			});
    }

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
                renderPageWithUserInfo('home/profile.njk', determineUser, req);
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