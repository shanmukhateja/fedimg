import { generateKeyPair } from "crypto";
import { ServerInfo } from "../models/server-info.model.js";
import { UserKeysInfo } from "../models/api/user-keys.model.js";

export function verifyUserIsLocal(serverInfo: ServerInfo, userNameOrEmail: string): boolean {
    const split = userNameOrEmail.split('@');
    const isEmail = split.length > 1;

    // FIXME: improve this logic
    if (isEmail) {
        const domain = split[0] == '' ? split[2] : split[1];
        return domain == serverInfo.hostname || domain.includes('localhost');
    }
    // TODO: add support for usernames only!

    return false;
}

export function generateUserId(serverInfo: ServerInfo, username: string) {
    return `${serverInfo.schema}://${serverInfo.hostname}:${serverInfo.port}/users/${username}`
}


// FIXME: implement
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