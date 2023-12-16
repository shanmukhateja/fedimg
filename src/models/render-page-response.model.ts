import { Image } from "../entity/Image.js";

export interface RenderPagePayload {
    isLoggedIn: boolean,
    showProfileEditOptions: boolean,
    loggedInUser?: RenderPagePayloadProfileUser,
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
    userName: string,
    userEmail: string,
    userAvatar: string
}