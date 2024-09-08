import { Image } from "../entity/Image.js";
import { Attachment, Tag } from "./user-info-response.model.js";

export interface RenderPagePayload {
    isLoggedIn: boolean,
    showProfileEditOptions: boolean,
    loggedInUser?: RenderPagePayloadProfileUser,
    isMyFollower?: boolean,
    isFollowedByMe?: boolean,
    metadata: {
        // FIXME: remove this hack
        followersCount: number
        followingCount: number,
        postsCount: number,
        showFollowButton: boolean
    },
    profileUser: RenderPagePayloadProfileUser,
    posts: Image[]
}

export interface RenderPagePayloadProfileUser {
    name: string,
    username: string,
    userEmail: string,
    userAvatar: string,
    userTags: Tag[],
    userAttachments: Attachment[]
}