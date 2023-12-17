export class UserPublicKey {
    id: string;
    owner: string;
    publicKeyPem: string;
}

export interface UserKeysInfo {
    privateKey: string,
    userPublicKey: UserPublicKey
}
