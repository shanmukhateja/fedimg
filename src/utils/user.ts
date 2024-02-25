import { generateKeyPair } from "crypto";
import { ServerInfo } from "../models/server-info.model.js";
import { UserKeysInfo } from "../models/api/user-keys.model.js";
import { getBaseURL } from "./url.js";
import { UserService } from "../services/user.service.js";


export function generateEmailAndUsernameFromId(id: string) {
    const url = new URL(id);

    const lastItemOfPathname = url.pathname.split('/');
    const emailSuffix = lastItemOfPathname[lastItemOfPathname.length - 1];
    return {
        email: `${emailSuffix}@${url.host}`,
        username: emailSuffix
    }
}

export async function verifyUserIsLocal(serverInfo: ServerInfo, userNameOrEmail: string): Promise<boolean> {
    const split = userNameOrEmail.split('@');
    const hasPrefixAtChar = split[0] == '';
    const isEmail = hasPrefixAtChar || userNameOrEmail.includes('@');

    // FIXME: improve this logic
    if (isEmail) { 
        const domain = hasPrefixAtChar ? split[2] : split[1];
        return domain == serverInfo.hostname || domain.includes('localhost');
    } else {
        // assume username
        return !!await UserService.getUserByKey('preferredUsername', userNameOrEmail);
    }
}

export function generateUserId(serverInfo: ServerInfo, username: string) {
    return `${getBaseURL(serverInfo)}users/${username}`
}

export async function generateUserKey(serverInfo: ServerInfo, username: string): Promise<UserKeysInfo> {
    return new Promise((resolve, reject) => {

        generateKeyPair(
            'ed25519', {
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            },
        },
            (err, publicKey, privateKey) => {

                if (err) {
                    reject(err);
                    return;
                }

                const owner = generateUserId(serverInfo, username);
                const responsePayload = {
                    privateKey,
                    userPublicKey: {
                        id: `${owner}#main-key`,
                        owner,
                        publicKeyPem: publicKey
                    }
                }

                resolve(responsePayload);
            }
        )
    })
}