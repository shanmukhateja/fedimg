import { MastodonUserLookup } from '../models/user-lookups/lookup-mastodon.model';
import { UserInfoResponseModel } from '../models/user-info-response.model';
import { fetchRemoteDataFromURL } from '../utils/url.js';
import { UserLookupService } from '../services/user-lookup.service';

export class UserLookupController {

    static async lookupUser(userNameOrEmail: string) {
        try {
            const { split, domain, username, strippedEmail } = UserLookupService.parseUserInputString(userNameOrEmail);
            const isEmail = split.length > 1;

            if (!isEmail) return null;

            // Webfinger search
            const url = `https://${domain}/.well-known/webfinger?resource=acct:${strippedEmail}`;
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

            const userIdLink = response.links.find(e => e.type.includes('html'));

            // mock 'User' object
            let user = {
                _id: userIdLink.href,
                displayName: remoteUser.name,
                avatar: remoteUser.icon?.url,
                preferredUsername: remoteUser.preferredUsername,
                email: isEmail ? userNameOrEmail : `@${username}@${domain}`,
                tags: remoteUser.tag,
                attachments: remoteUser.attachment
            };

            return user;

        } catch (error) {
            // FIXME: implement logger to keep track of these issues.
            console.warn(error);
            return null;
        }

    }

}