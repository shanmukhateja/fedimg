import { AxiosError } from "axios";
import { Response } from "express";
import { FollowActivityModel, FollowActivityTypes, ActivityStreamTypes } from "../../models/activity.model";
import { HttpSignature } from "../../models/http-signature.model";
import { ServerInfo } from "../../models/server-info.model";
import { AuthService } from "../../services/auth.service";
import { UserLookupService } from "../../services/user-lookup.service";
import { UserService } from "../../services/user.service";
import { generateASId, getBaseURL, sendRequest } from "../../utils/url";
import { generateEmailAndUsernameFromId, verifyUserIsLocal } from "../../utils/user";

export class FollowActivityController {

    static async handleFollowEvent(activity: FollowActivityModel, res: Response) {
		const { actor, object } = activity;

		const serverInfo: ServerInfo = res.req.app.get('serverInfo');

		const actorData = generateEmailAndUsernameFromId(actor);
		const objectData = generateEmailAndUsernameFromId(object);

		// Cannot have 2 accounts one for email with '@' and one w/o '@'
		if (objectData.email.startsWith('@')) {
			objectData.email = objectData.email.substring(1);
			objectData.username = objectData.username.substring(1);
		}

		const actorEmail = actorData.email;
		const objectEmail = objectData.email;
		const isActorLocal = await verifyUserIsLocal(actorEmail);
		const isObjectLocal = await verifyUserIsLocal(objectEmail);

		let followActivityType: FollowActivityTypes = null;

		if (!isActorLocal && !isObjectLocal) {
			// A user from a foreign domain is following a user from another foreign domain.
			// FIXME: Why does this matter to us?
			followActivityType = FollowActivityTypes.FOREIGN_TO_FOREIGN;
			res.status(400).json({ error: 'Unexpected request.' });
			return;
		}

		if (!isActorLocal) {
			// This means we are being informed by `object`'s server that a user
			// belonging to our domain was followed by them.
			// Need to save that user's info into `object.followers` collection.

			followActivityType = FollowActivityTypes.FOREIGN_TO_LOCAL;

			// failsafe
			if (!isObjectLocal) {
				res.status(400).send({ error: 'object user doesn\'t belong to our domain.' });
				return;
			}

			const objectUser = await UserService.getUserByKey('email', objectEmail);

			// Check if this user has an account with us already.
			let nonLocalAccountForActor = await UserService.getUserByKey('recovery_email', actorEmail);
			if (!nonLocalAccountForActor) {
				// Create a non-local user to save the user info.
				nonLocalAccountForActor = await AuthService.registerUserAPI(serverInfo, {
					agreement: 'TRUE',
					email: actorEmail,
					locale: 'en',
					// FIXME: need to generate secure password
					password: 'changeme',
					// this way we don't interfere with local accounts
					username: objectData.username + '-remote',
					isLocal: false
				});
			}

			const isAlreadyFollowing = await UserService.checkUserIsFollower(objectUser.id, nonLocalAccountForActor.id);

			if (isAlreadyFollowing) {
				console.log(`User '${nonLocalAccountForActor.email}' is already following '${objectUser.email}', returning 204`);
				res.sendStatus(204);
				return;
			}

			// Update db
			await UserService.appendToFollowersCollection(objectUser, nonLocalAccountForActor);
		} else {
			// A user from our domain has followed a user from some other domain.
			// FIXME: Need to check and handle cases when users from same domain 
			// use Follow feature.

			followActivityType = FollowActivityTypes.LOCAL_TO_FOREIGN;

			/**
			 * 1. We will send a Follow request to the remote server.
			 * 2. We expect to receive a "Accept event" when this is successful.
			 * 2.1 If we do receive an "Accept", we then add the user to followers.
			 * 2.2 If not, we do nothing.
			 */

			const objectUser = UserLookupService.parseUserInputString(objectEmail);
			const objectUserInboxURL = `https://${objectUser.domain}/users/${objectUser.username}/inbox`;
			console.log('Object user Inbox URL ->', objectUserInboxURL);

			// FIXME: do we need to save this id in db?
			// FIXME: duplicate code
			const followRequestAcceptedId = generateASId();
			const httpSignature = new HttpSignature(null);

			const payload = {
				"@context": "https://www.w3.org/ns/activitystreams",
				"id": `${getBaseURL(serverInfo)}${followRequestAcceptedId}`,
				"type": ActivityStreamTypes.FOLLOW,
				"actor": activity.actor,
				"object": activity.object
			};

			// 1.b generate signature, digest headers
			const genSigHeaders = await httpSignature.generate({
				inboxUrl: objectUserInboxURL,
				serverInfo,
				senderId: actor,
				recipientId:  object,
				data: payload
			});

			await sendRequest(objectUserInboxURL, 'POST', genSigHeaders, payload)
			.then(response => {
				console.log('GOT RESPONSE FOR DO FOLLOW REQUEST.', response.headers);
				console.log('GOT RESPONSE FOR DO FOLLOW REQUEST.', response.status);
				console.log('GOT RESPONSE FOR DO FOLLOW REQUEST.', response.statusText);
			})
			.catch((error: AxiosError) => {
				delete error.response?.request;
				console.log('GOT ERROR FOR DO FOLLOW REQUEST');
				console.error('error code: ', error.code)
				console.error('request headers: ', error.request?._header)
				console.error('generated headers: ', genSigHeaders)
				console.error('response data: ', error.response.data)
			});
		}

		// 1. Send "Accept" message as another request
		// and return 204 No Content as response for this one.

		// We send "Accept" response when remote server expects one.
		if (followActivityType == FollowActivityTypes.FOREIGN_TO_LOCAL) {
			// FIXME: do we need to save this id in db?
			const followRequestAcceptedId = generateASId();
			const httpSignature = new HttpSignature(null);

			// 1.a create "Accept" response
			const data = {
				"@context": "https://www.w3.org/ns/activitystreams",
				"id": `${getBaseURL(serverInfo)}${followRequestAcceptedId}`,
				"type": ActivityStreamTypes.ACCEPT,
				"actor": activity.object,
				// In order for Mastodon to allow us as a follower, we can either send 2 things:
				// 1. original object in JSON object format (not JSON string)
				// 2. follow request `id` which Mastodon sent us (can be found in `activity` parameter)
				"object": JSON.parse(res.req['rawBody'])
			};

			// 1.b generate signature, digest headers
			const url = ''.concat(isActorLocal ? object : actor, '/inbox');
			const genSigHeaders = await httpSignature.generate({
				inboxUrl: url,
				serverInfo,
				senderId: isActorLocal ? actor : object,
				recipientId: isActorLocal ? object: actor,
				data
			});

			// 1.c send the signed payload to receipient.
			await sendRequest(url, 'POST', genSigHeaders, data)
			.then(response => {
				console.log('GOT RESPONSE FOR FOLLOW ACCEPT REQUEST.', response.headers);
				console.log('GOT RESPONSE FOR FOLLOW ACCEPT REQUEST.', response.status);
				console.log('GOT RESPONSE FOR FOLLOW ACCEPT REQUEST.', response.statusText);
			})
			.catch((error: AxiosError) => {
				delete error.response?.request;
				console.log('GOT ERROR FOR FOLLOW ACCEPT');
				console.error('error code: ', error.code)
				console.error('request headers: ', error.request?._header)
				console.error('generated headers: ', genSigHeaders)
				console.error('response data: ', error.response.data)
			});
		}

		// 2
		res.sendStatus(204);
	}
}