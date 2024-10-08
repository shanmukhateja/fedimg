import { MediaController } from "../controllers/media.controller.js";
import { Image } from "../entity/Image.js";
import { User } from "../entity/User.js";
import { RenderPagePayload } from "../models/render-page-response.model.js";
import { verifyUserIsLocal } from "./user.js";
import { UserService } from "../services/user.service.js";
import { Request } from "express";


export async function renderPageWithUserInfo(pageURL: string, user: User, req: Request) {
    const isUserLocal = await verifyUserIsLocal(user.email);

    // remote accounts don't support listing posts or post count
    let postsCount = 0;
    let posts: Image[] = [];
    if (isUserLocal) {
        postsCount = await MediaController.getMediaCountByUser(user.preferredUsername);
        posts = await MediaController.getMediaByUser(user.preferredUsername);
    }

    // FIXME: implement
    const showFollowButton = true;

    const isUserSameAsProfileUser = user._id && (req.user as User)?._id === user._id;

    // followers collection
    let isUserFollowingProfileUser = false;
    if (req.user) {
        isUserFollowingProfileUser = await UserService.checkUserIsFollower(
            user.email.toString(), 
            (req.user as User)?.email.toString()
        );
    }

    // following collection
    let isUserFollowedByProfileUser = false;
    if (req.user) {
        isUserFollowedByProfileUser = await UserService.checkUserIsFollowed(
            user.email.toString(), 
            (req.user as User)?.email.toString()
        );
    }

    let renderPayload = {
        isLoggedIn: req.isAuthenticated(),
        showProfileEditOptions: isUserSameAsProfileUser,
        isMyFollower: isUserFollowingProfileUser,
        isFollowedByMe: isUserFollowedByProfileUser
    } as RenderPagePayload

    // Inject currently logged-in user info (if available)
    if (renderPayload.isLoggedIn) {
        const user = req.user as User;
        renderPayload.loggedInUser = {
            name: user?.displayName,
            username: user?.preferredUsername,
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
            followingCount: (user.following || []).length,
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
            name: user.displayName,
            username: user.preferredUsername,
            userEmail: user.email,
            // FIXME lookupUser types mismatch with User.entity.ts
            userAvatar: user.avatar as any,
            // Note: Pixelfed doesn't support it
            userTags: user.tags,
            // Note: Pixelfed doesn't support it
            userAttachments: user.attachments
        }

        // when any local user's profile is requested 
        // FIXME: improve this
        renderPayload.posts = posts;
        renderPayload.metadata.postsCount = postsCount;
    }
    return {
        pageURL,
        renderPayload
    };
}
