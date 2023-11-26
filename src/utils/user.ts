import { UserPublicKey } from "../entity/User";
import { ServerInfo } from "../models/server-info.model";


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