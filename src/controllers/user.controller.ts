import { hash, compare } from "bcrypt";
import { AppDataSource } from "../data-source.js";
import { User } from "../entity/User.js";
import { Response } from "express";
import { MediaController } from "./media.controller.js";
import { verifyUserIsLocal } from "../utils/user.js";
import { Image } from "../entity/Image.js";
import { RenderPagePayload } from "../models/render-page-response.model.js";

export class UserController {

    static async getUserById(username: string): Promise<User> {
        // strip '@' character if exists
        if (username.startsWith('@')) {
            username = username.slice(0);
        }
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOneBy({
            preferredUsername: username
        });

        if (!user) return null;

        return user;
    }

    // FIXME: find a better way
    static async getUserByIdSafe(username: string): Promise<User> {

        const user = await this.getUserById(username);

        if (!user) return null;

        delete user._id;
        delete user.password;
        delete user.privateKey;

        return user;
    }

    static async getUserByKey(key: string, value: any) {
        const userRepo = AppDataSource.getRepository(User);

        const user = await userRepo.findOneBy({
            [key]: value
        })

        if (!user) return null;

        return user;
    }
    static async getUserByKeySafe(key: string, value: any) {
        const user = await this.getUserByKey(key, value);

        if (!user) return null;

        delete user._id;
        delete user.password;
        delete user.privateKey;

        return user;
    }


    static async generateHashedPassword(password: string) {
        const saltRounds = 10;

        return await hash(password, saltRounds)
    }


    static async validatePassword(username: string, password: string) {
        const user = await this.getUserById(username);
        return await compare(password, user.password);
    }

    static async renderPageWithUserInfo(pageURL: string, user: User, res: Response) {
        const isUserLocal = verifyUserIsLocal(res.app.get('serverInfo'), user.email);

        // remote accounts don't support listing posts or post count
        let postsCount = 0;
        let posts: Image[] = [];
        if (isUserLocal) {
            postsCount = await MediaController.getMediaCountByUser(user.preferredUsername);
            posts = await MediaController.getMediaByUser(user.preferredUsername);
        }

        // FIXME: implement
        const showFollowButton = true;

        const isUserSameAsProfileUser = user._id && (res.req.user as User)?._id === user._id;

        let renderPayload = {
            isLoggedIn: res.req.isAuthenticated(),
            showProfileEditOptions: isUserSameAsProfileUser,
        } as RenderPagePayload

        // Inject currently logged-in user info (if available)
        if (renderPayload.isLoggedIn) {
            const user = res.req.user as User;
            renderPayload.loggedInUser = {
                userName: user?.displayName,
                userEmail: user?.email,
                userAvatar: user?.avatar?.url,
                // Note: Pixelfed doesn't support this
                userTags: [],
                // Note: Pixelfed doesn't support this
                userAttachments: []
            }
        }

        if (isUserSameAsProfileUser) {
            // we'll be rendering profile of logged in user.
            renderPayload.metadata = {
                // FIXME: remove this hack
                followersCount: (user.followers || []).length,
                followingCount: user.followingCount,
                postsCount,
                showFollowButton,
            }
            renderPayload.profileUser = renderPayload.loggedInUser;
            renderPayload.posts = posts;
        } else {
            // not the logged=in user
            renderPayload.metadata = {
                followersCount: 0,
                followingCount: 0,
                postsCount: 0,
                showFollowButton,
            }
            renderPayload.profileUser = {
                userName: user.displayName,
                userEmail: user.email,
                // FIXME lookupUser types mismatch with User.entity.ts
                userAvatar: user.avatar as any,
                // Note: Pixelfed doesn't support it
                userTags: user.tags,
                // Note: Pixelfed doesn't support it
                userAttachments: user.attachments
            }
            renderPayload.posts = [];
        }
        res.render(pageURL, renderPayload)
    }

    static async updateDisplayName(username: string, newName: string) {
        const userRepo = AppDataSource.getRepository(User);

        return await userRepo.update({ preferredUsername: username }, {
            displayName: newName
        });

    }
}