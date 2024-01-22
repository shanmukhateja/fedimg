import { User } from "../entity/User";
import { ServerInfo } from "../models/server-info.model";
import { WellknownResponseModel } from "../models/well-known.model";
import { getBaseURL } from "./url";

export function processWebFingerResourceUri(uri: string) {
    if (uri.startsWith('acct:')) {
        const acctSplit = uri.split('acct:');

        if (acctSplit.length == 2) {
            const split2 = acctSplit[1].split('@');

            return {
                isValid: split2.length == 2,
                values: acctSplit[1]
            };
        }

    }

    return {
        isValid: false,
        values: null
    };
}

export function generateWellKnownResponse(user: User, serverInfo: ServerInfo): WellknownResponseModel {
    const { email: lookupUserEmail, avatar } = user;
    const payload = {
        subject: `acct:${lookupUserEmail}`,
        // TODO
        aliases: [],
        links: [
            {
                rel: "http://webfinger.net/rel/profile-page",
                type: "text/html",
                href: `${getBaseURL(serverInfo)}users/${lookupUserEmail}`
            },
            {
                rel: "self",
                type: "application/activity+json",
                href: `${getBaseURL(serverInfo)}users/${lookupUserEmail}`
            },
        ]
    }

    // insert avatar if user set profile pic
    if (avatar) {
        payload.links.push({
            "rel": "http://webfinger.net/rel/avatar",
            "type": avatar?.mediaType,
            "href": avatar?.url
        })
    }

    return payload;
}