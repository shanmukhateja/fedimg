import { UserPublicKey } from "../entity/User";
import { ServerInfo } from "../models/server-info.model.js";

export function verifyUserIsLocal(serverInfo: ServerInfo, userNameOrEmail: string): boolean {
    const split = userNameOrEmail.split('@');
    const isEmail = split.length > 1;

    if (isEmail) {
        // const username = split[1];
        const domain = split[2];
        return domain == serverInfo.hostname;
        
    }
    // TODO: add support for usernames only!

    return false;
}

export function generateUserId(serverInfo: ServerInfo, username: string) {
    return `${serverInfo.schema}://${serverInfo.hostname}:${serverInfo.port}/users/${username}`    
}


// FIXME: implement
export function generateUserKey(serverInfo: ServerInfo, username: string): UserPublicKey {
    return {
        id: 'stub',
        owner: generateUserId(serverInfo, username),
        publicKeyPem: 'stub'
    };
}