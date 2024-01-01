import { MastodonUserLookup } from '../models/user-lookups/lookup-mastodon.model';
import { UserInfoResponseModel } from '../models/user-info-response.model';
import { fetchRemoteDataFromURL } from '../utils/url.js';

export class UserLookupController {

    static async lookupUser(userNameOrEmail: string) {
        const split = userNameOrEmail.split('@');
        const isEmail = split.length > 1;
        if (isEmail) {
            // FIXME: find a better way
            const usernameIndex = userNameOrEmail.startsWith('@') ? 1 : 0;
            const domainIndex = userNameOrEmail.startsWith('@') ? 2 : 1;
            const username = split[usernameIndex];
            // FIXME: domain must NOT include port number
            const domain = split[domainIndex];

            // Ask domain about the user
            let strippedEmail = userNameOrEmail;
            if (userNameOrEmail.startsWith('@')) {
                strippedEmail = userNameOrEmail.slice(1);
            }
            const url = `https://${domain}/.well-known/webfinger?resource=acct:${strippedEmail}`;

            try {
                const response: MastodonUserLookup = await fetchRemoteDataFromURL(url);

                // Fetch remote user's info

                const link = response.links.find(e => [
                    'application/ld+json',
                    'application/activity+json',
                    'application/json'
                ].includes(e.type));

                // FIXME: find alternative
                if (!link) return null;

                const remoteUser: UserInfoResponseModel = await fetchRemoteDataFromURL(link.href);

                // mock 'User' object
                let user = {
                    _id: null,
                    displayName: remoteUser.name,
                    avatar: remoteUser.icon?.url,
                    preferredUsername: remoteUser.preferredUsername,
                    email: isEmail ? userNameOrEmail : `@${username}@${domain}`,
                    tags: remoteUser.tag,
                    attachments: remoteUser.attachment
                };

                return user;

            } catch (error) {
                return null;
            }

        }
        return null;

    }

}