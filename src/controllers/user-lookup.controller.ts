import axios from 'axios';
import { MastodonUserLookup } from '../models/user-lookups/lookup-mastodon.model';
import { UserInfoResponseModel } from '../models/user-info-response.model';

export class UserLookupController {

    static async lookupUser(userNameOrEmail: string) {
        const split = userNameOrEmail.split('@');
        const isEmail = split.length > 1;
        if (isEmail) {
            const username = split[1];
            const domain = split[2];

            // Ask domain about the user
            let strippedEmail = userNameOrEmail;
            if (userNameOrEmail.startsWith('@')) {
                strippedEmail = userNameOrEmail.slice(1);
            }
            const url = `https://${domain}/.well-known/webfinger?resource=acct:${strippedEmail}`;

            try {
                const result = await axios.get(url);
                const response = result.data as MastodonUserLookup;

                // Fetch remote user's info

                const link = response.links.find(e => [
                    'application/ld+json', 
                    'application/activity+json',
                    'application/json'
                ].includes(e.type));

                // FIXME: find alternative
                if (!link) return null;

                const remoteUser = await this.getRemoteUserInfo(link.href);

                // mock 'User' object
                let user = {
                    _id: null,
                    displayName: remoteUser.name,
                    avatar: remoteUser.icon?.url,
                    preferredUsername: remoteUser.preferredUsername,
                    email: isEmail ? userNameOrEmail : `@${username}@${domain}`,
                };

                return user;

            } catch (error) {
                return null;
            }

        }
        return null;

    }

    static async getRemoteUserInfo(url: string): Promise<UserInfoResponseModel> {

        const result = await axios.get(url, {
            headers: {
                Accept: 'application/ld+json'
            }
        });

        return result.data;
    }
}